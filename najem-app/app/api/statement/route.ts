// app/api/statement/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// --- Typ pro custom poplatek + type‐guard ---
type CustomCharge = {
  name:    string
  amount:  number
  enabled: boolean
}
function isCustomCharge(x: unknown): x is CustomCharge {
  if (typeof x !== 'object' || x === null) return false
  const obj = x as Record<string, unknown>
  return (
    typeof obj.name    === 'string' &&
    typeof obj.amount  === 'number' &&
    typeof obj.enabled === 'boolean'
  )
}

// --- Typ pro statementEntry (override záznam) ---
type OverrideEntry = {
  lease_id:     string
  year:         number
  month:        number
  charge_id:    string   // id poplatku, nebo '' pro poznámku
  override_val: number | null
  note:         string | null
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
    // 1) Parsování datumu
    const fromObj = parseYm(from)
    const toObj   = parseYm(to)

    // 2) Načti všechny lease pro danou jednotku
    const leases   = await prisma.lease.findMany({ where: { unit_id: unitId } })
    const leaseIds = leases.map(l => l.id)

    // 3) Načti monthlyObligation v období
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

    // 4) Načti statementEntry override
    const rawOverrides = await prisma.statementEntry.findMany({
      where: { lease_id: { in: leaseIds } }
    })
    const overrides: OverrideEntry[] = rawOverrides.map(o => ({
      lease_id:     o.lease_id,
      year:         o.year,
      month:        o.month,
      charge_id:    o.charge_id,
      override_val: o.override_val,
      note:         o.note
    }))

    // 5) Sestav seznam měsíců
    const months = getMonthsInRange(fromObj, toObj)

    // 6) Definice základních poplatků
    const chargeKeys = [
      { id: 'rent',        label: 'Nájem',      field: 'rent'         as const, flag: 'rent_amount' },
      { id: 'electricity', label: 'Elektřina',  field: 'electricity' as const, flag: 'monthly_electricity' },
      { id: 'water',       label: 'Voda',       field: 'water'        as const, flag: 'monthly_water' },
      { id: 'gas',         label: 'Plyn',       field: 'gas'          as const, flag: 'monthly_gas' },
      { id: 'services',    label: 'Služby',     field: 'services'    as const, flag: 'monthly_services' },
      { id: 'repair_fund', label: 'Fond oprav', field: 'repair_fund' as const, flag: 'repair_fund' }
    ]

    // 7) Pivot standardních poplatků + override
    const matrixData = chargeKeys.map(key => {
      const values: number[] = months.map(({ year, month }) => {
        const obl = obligations.find(o => o.year === year && o.month === month)
        const flags = (obl?.charge_flags ?? {}) as Record<string, boolean>

        // základní částka
        const base = obl && flags[key.flag]
          ? typeof obl[key.field] === 'number'
            ? obl[key.field]
            : 0
          : 0

        // override
        const ov = overrides.find(o =>
          o.lease_id  === unitId &&
          o.year      === year   &&
          o.month     === month  &&
          o.charge_id === key.id
        )
        return ov?.override_val ?? base
      })

      const total = values.reduce((sum, v) => sum + v, 0)
      return { id: key.id, name: key.label, values, total }
    })

    // 8) Pivot custom poplatků + override
    const allCustomNames = obligations.flatMap(o =>
      (Array.isArray(o.custom_charges) ? o.custom_charges : [])
        .filter(isCustomCharge)
        .filter(c => c.enabled)
        .map(c => c.name)
    )
    const customNames = Array.from(new Set(allCustomNames))

    const customMatrix = customNames.map(name => {
      const values: number[] = months.map(({ year, month }) => {
        const obl = obligations.find(o => o.year === year && o.month === month)

        // základní
        const baseCharge = obl
          ? ((Array.isArray(obl.custom_charges) ? obl.custom_charges : [])
              .filter(isCustomCharge)
              .find(c => c.name === name && c.enabled)
              ?.amount ?? 0)
          : 0

        // override
        const ov = overrides.find(o =>
          o.lease_id  === unitId &&
          o.year      === year   &&
          o.month     === month  &&
          o.charge_id === name
        )
        return ov?.override_val ?? baseCharge
      })

      const total = values.reduce((sum, v) => sum + v, 0)
      return { id: name, name, values, total }
    })

    // 9) Vrať výsledek
    return NextResponse.json({
      paymentsMatrix: {
        months,
        data: [...matrixData, ...customMatrix]
      },
      overrides
    })
  }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
