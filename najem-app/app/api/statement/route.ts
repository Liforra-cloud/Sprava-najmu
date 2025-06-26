// app/api/statement/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// --- Typy pro custom poplatek + type‐guard ---
type CustomCharge = {
  name:    string
  amount:  number
  enabled: boolean
}
function isCustomCharge(x: unknown): x is CustomCharge {
  return (
    typeof x === 'object' &&
    x !== null &&
    'name'    in x && typeof (x as any).name    === 'string' &&
    'amount'  in x && typeof (x as any).amount  === 'number' &&
    'enabled' in x && typeof (x as any).enabled === 'boolean'
  )
}

// --- Typ pro uživatelský přepis (statementEntry) ---
type OverrideEntry = {
  lease_id:    string
  year:        number
  month:       number
  charge_id:   string   // id poplatku, nebo '' pro poznámku
  override_val: number | null
  note:        string | null
}

function parseYm(ym: string) {
  const [year, month] = ym.split('-').map(Number)
  return { year, month }
}

function getMonthsInRange(
  from: { year: number; month: number },
  to:   { year: number; month: number }
) {
  const months: { year: number; month: number }[] = []
  let y = from.year, m = from.month
  while (y < to.year || (y === to.year && m <= to.month)) {
    months.push({ year: y, month: m })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

// --- GET handler ---
export async function GET(req: NextRequest) {
  const url    = new URL(req.url)
  const unitId = url.searchParams.get('unitId')
  const from   = url.searchParams.get('from')
  const to     = url.searchParams.get('to')

  if (!unitId || !from || !to) {
    return NextResponse.json(
      { error: 'unitId, from a to jsou povinné parametry' },
      { status: 400 }
    )
  }

  try {
    const fromObj = parseYm(from)
    const toObj   = parseYm(to)

    // 1) Načti lease pro danou jednotku
    const leases   = await prisma.lease.findMany({ where: { unit_id: unitId } })
    const leaseIds = leases.map(l => l.id)

    // 2) Načti monthlyObligation v období
    const obligations = await prisma.monthlyObligation.findMany({
      where: {
        lease_id: { in: leaseIds },
        OR: [
          { year: fromObj.year,                month: { gte: fromObj.month } },
          { year: toObj.year,                  month: { lte: toObj.month } },
          { year: { gt: fromObj.year, lt: toObj.year } }
        ]
      }
    })

    // 3) Načti statementEntry override záznamy
    const rawOverrides = await prisma.statementEntry.findMany({
      where: { lease_id: { in: leaseIds } }
    })
    const overrides: OverrideEntry[] = rawOverrides.map(o => ({
      lease_id:    o.lease_id,
      year:        o.year,
      month:       o.month,
      charge_id:   o.charge_id,
      override_val: o.override_val,
      note:        o.note
    }))

    // 4) Sestav posloupnost měsíců
    const months = getMonthsInRange(fromObj, toObj)

    // 5) Definice standardních poplatků
    const chargeKeys = [
      { id: 'rent',        label: 'Nájem',     field: 'rent'         as const, flag: 'rent_amount' },
      { id: 'electricity', label: 'Elektřina', field: 'electricity' as const, flag: 'monthly_electricity' },
      { id: 'water',       label: 'Voda',      field: 'water'        as const, flag: 'monthly_water' },
      { id: 'gas',         label: 'Plyn',      field: 'gas'          as const, flag: 'monthly_gas' },
      { id: 'services',    label: 'Služby',    field: 'services'    as const, flag: 'monthly_services' },
      { id: 'repair_fund', label: 'Fond oprav',field: 'repair_fund' as const, flag: 'repair_fund' }
    ]

    // 6) Pivot standardních poplatků + uplatnění override
    const matrixData = chargeKeys.map(key => {
      const values: number[] = months.map(({ year, month }) => {
        const obl = obligations.find(o => o.year === year && o.month === month)
        const flags = (obl?.charge_flags ?? {}) as Record<string, boolean>

        // základní
        let base = 0
        if (obl && flags[key.flag]) {
          base = typeof obl[key.field] === 'number' ? obl[key.field] : 0
        }
        // override
        const ov = overrides.find(o =>
          o.lease_id === unitId &&
          o.year     === year    &&
          o.month    === month   &&
          o.charge_id=== key.id
        )
        return ov?.override_val ?? base
      })

      const total = values.reduce((s, v) => s + v, 0)
      return { id: key.id, name: key.label, values, total }
    })

    // 7) Pivot custom poplatků + override
    const allCustom = obligations.flatMap(o =>
      (Array.isArray(o.custom_charges) ? o.custom_charges : [])
        .filter(isCustomCharge).filter(c => c.enabled).map(c => c.name)
    )
    const customNames = Array.from(new Set(allCustom))

    const customMatrix = customNames.map(name => {
      const values: number[] = months.map(({ year, month }) => {
        const obl = obligations.find(o => o.year === year && o.month === month)
        let base = 0
        if (obl) {
          const found = (Array.isArray(obl.custom_charges) ? obl.custom_charges : [])
            .filter(isCustomCharge)
            .find(c => c.name === name && c.enabled)
          base = found?.amount ?? 0
        }
        const ov = overrides.find(o =>
          o.lease_id  === unitId &&
          o.year      === year   &&
          o.month     === month  &&
          o.charge_id === name
        )
        return ov?.override_val ?? base
      })

      const total = values.reduce((s, v) => s + v, 0)
      return { id: name, name, values, total }
    })

    return NextResponse.json({
      paymentsMatrix: {
        months,
        data: [...matrixData, ...customMatrix]
      },
      overrides
    })
  }
  catch (err: unknown) {
    // žádné 'any' – pokud je to Error, vezmi message, jinak stringify
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
