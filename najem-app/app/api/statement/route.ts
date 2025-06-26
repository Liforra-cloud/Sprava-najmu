// app/api/statement/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

//
// --- CustomCharge + type‐guard
//
type CustomCharge = {
  name:    string
  amount:  number
  enabled: boolean
}
function isCustomCharge(x: unknown): x is CustomCharge {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  return (
    typeof o.name    === 'string' &&
    typeof o.amount  === 'number' &&
    typeof o.enabled === 'boolean'
  )
}

//
// --- OverrideEntry typ pro API
//
export type OverrideEntry = {
  lease_id:     string
  year:         number
  month:        number
  charge_id:    string
  override_val: number | null
  note:         string | null
}

//
// --- parse “YYYY-MM” na { year, month }
//
function parseYm(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m }
}

//
// --- vygeneruje seznam měsíců mezi dvěma daty
//
function getMonthsInRange(
  from: { year: number; month: number },
  to:   { year: number; month: number }
) {
  const arr: { year: number; month: number }[] = []
  let y = from.year, mo = from.month
  while (y < to.year || (y === to.year && mo <= to.month)) {
    arr.push({ year: y, month: mo })
    mo++
    if (mo > 12) { mo = 1; y++ }
  }
  return arr
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
    // 1) rozparsuj období
    const fromObj = parseYm(from)
    const toObj   = parseYm(to)

    // 2) najdi všechny lease pro danou jednotku
    const leases  = await prisma.lease.findMany({ where: { unit_id: unitId } })
    const leaseIds = leases.map(l => l.id)

    // 3) načti obligations
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

    // 4) načti override záznamy a přetypuj Decimal → number
    const rawOverrides = await prisma.statementEntry.findMany({
      where: { lease_id: { in: leaseIds } }
    })
    const overrides: OverrideEntry[] = rawOverrides.map(o => ({
      lease_id:     o.lease_id,
      year:         o.year,
      month:        o.month,
      charge_id:    o.charge_id,
      override_val: o.override_val === null
                       ? null
                       : o.override_val.toNumber(),
      note:         o.note
    }))

    // 5) sestav pole měsíců
    const months = getMonthsInRange(fromObj, toObj)

    // 6) pivot standardních poplatků + overrides
    const standardKeys = [
      { id: 'rent',        label: 'Nájem',      field: 'rent'         as const, flag: 'rent_amount' },
      { id: 'electricity', label: 'Elektřina',  field: 'electricity' as const, flag: 'monthly_electricity' },
      { id: 'water',       label: 'Voda',       field: 'water'        as const, flag: 'monthly_water' },
      { id: 'gas',         label: 'Plyn',       field: 'gas'          as const, flag: 'monthly_gas' },
      { id: 'services',    label: 'Služby',     field: 'services'    as const, flag: 'monthly_services' },
      { id: 'repair_fund', label: 'Fond oprav', field: 'repair_fund' as const, flag: 'repair_fund' }
    ]

    const matrixData = standardKeys.map(key => {
      const values = months.map(({ year, month }) => {
        const obl   = obligations.find(o => o.year === year && o.month === month)
        const flags = (obl?.charge_flags ?? {}) as Record<string, boolean>
        const base  = obl && flags[key.flag] && typeof obl[key.field] === 'number'
          ? obl[key.field]
          : 0

        const ov = overrides.find(o =>
          o.lease_id  === unitId &&
          o.charge_id === key.id  &&
          o.year      === year    &&
          o.month     === month
        )
        return ov?.override_val ?? base
      })

      return {
        id:    key.id,
        name:  key.label,
        values,
        total: values.reduce((a, b) => a + b, 0)
      }
    })

    // 7) pivot custom poplatků + overrides
    const allCustom = obligations.flatMap(o =>
      (Array.isArray(o.custom_charges) ? o.custom_charges : [])
        .filter(isCustomCharge)
        .filter(c => c.enabled)
        .map(c => c.name)
    )
    const customNames = Array.from(new Set(allCustom))

    const customMatrix = customNames.map(name => {
      const values = months.map(({ year, month }) => {
        const obl = obligations.find(o => o.year === year && o.month === month)
        const base = obl
          ? (Array.isArray(obl.custom_charges) ? obl.custom_charges : [])
              .filter(isCustomCharge)
              .find(c => c.name === name && c.enabled)
              ?.amount ?? 0
          : 0

        const ov = overrides.find(o =>
          o.lease_id  === unitId &&
          o.charge_id === name  &&
          o.year      === year  &&
          o.month     === month
        )
        return ov?.override_val ?? base
      })

      return {
        id:    name,
        name,
        values,
        total: values.reduce((a, b) => a + b, 0)
      }
    })

    // 8) odpověď
    return NextResponse.json({
      paymentsMatrix: { months, data: [...matrixData, ...customMatrix] },
      overrides
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
