// app/api/statement/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// --- Typy pro custom poplatek + type guard ---
type CustomCharge = {
  name: string
  amount: number
  enabled: boolean
}
function isCustomCharge(x: unknown): x is CustomCharge {
  return (
    typeof x === 'object' &&
    x !== null &&
    'name' in x &&
    typeof (x as Record<string, unknown>).name === 'string' &&
    'amount' in x &&
    typeof (x as Record<string, unknown>).amount === 'number' &&
    'enabled' in x &&
    typeof (x as Record<string, unknown>).enabled === 'boolean'
  )
}

// Typ pro uživatelské přepisy
type Override = {
  lease_id:    string
  year:        number
  month:       number
  charge_id:   string    // id poplatku, nebo '' pro poznámku
  override_val?: number
  note?:        string
}

function parseYm(ym: string) {
  const [year, month] = ym.split('-').map(Number)
  return { year, month }
}

function getMonthsInRange(
  fromObj: { year: number; month: number },
  toObj:   { year: number; month: number }
) {
  const months: { month: number; year: number }[] = []
  let y = fromObj.year, m = fromObj.month
  while (y < toObj.year || (y === toObj.year && m <= toObj.month)) {
    months.push({ month: m, year: y })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

export async function GET(req: NextRequest) {
  try {
    const url    = new URL(req.url)
    const unitId = url.searchParams.get('unitId')
    const from   = url.searchParams.get('from')
    const to     = url.searchParams.get('to')

    if (!unitId || !from || !to) {
      return NextResponse.json(
        { error: 'unitId, from, to jsou povinné parametry' },
        { status: 400 }
      )
    }

    const fromObj = parseYm(from)
    const toObj   = parseYm(to)

    // 1) Načti lease
    const leases   = await prisma.lease.findMany({ where: { unit_id: unitId } })
    const leaseIds = leases.map(l => l.id)

    // 2) Načti monthly_obligation
    const obligations = await prisma.monthlyObligation.findMany({
      where: {
        lease_id: { in: leaseIds },
        OR: [
          { year: fromObj.year, month: { gte: fromObj.month } },
          { year: toObj.year,   month: { lte: toObj.month } },
          { year: { gt: fromObj.year, lt: toObj.year } }
        ]
      }
    })

    // 3) Načti uživatelské přepisy
    const overrides = (await prisma.statementEntry.findMany({
      where: { lease_id: { in: leaseIds } }
    })) as Override[]

    // 4) Sestav měsíce
    const months = getMonthsInRange(fromObj, toObj)

    // 5) Definice standardních poplatků
    const chargeKeys = [
      { id: 'rent',        label: 'Nájem',      flag: 'rent_amount' },
      { id: 'electricity', label: 'Elektřina',  flag: 'monthly_electricity' },
      { id: 'water',       label: 'Voda',       flag: 'monthly_water' },
      { id: 'gas',         label: 'Plyn',       flag: 'monthly_gas' },
      { id: 'services',    label: 'Služby',     flag: 'monthly_services' },
      { id: 'repair_fund', label: 'Fond oprav', flag: 'repair_fund' }
    ]

    // 6) Pivot pro standardní poplatky + override
    const matrixData = chargeKeys.map(key => {
      const values: (number | '')[] = months.map(({ year, month }) => {
        const o     = obligations.find(x => x.year === year && x.month === month)
        const flags = o?.charge_flags as Record<string, boolean> | null

        let base: number | '' = ''
        if (o && flags && flags[key.flag]) {
          base = (() => {
            switch (key.id) {
              case 'rent':        return o.rent
              case 'electricity': return o.electricity
              case 'water':       return o.water
              case 'gas':         return o.gas
              case 'services':    return o.services
              case 'repair_fund': return o.repair_fund
              default:            return 0
            }
          })()
        }

        const ov = overrides.find(o =>
          o.charge_id === key.id && o.year === year && o.month === month
        )
        return ov?.override_val ?? base
      })

      const total = values.reduce<number>(
        (sum, v) => sum + (typeof v === 'number' ? v : 0),
        0
      )

      return { id: key.id, name: key.label, values, total }
    })

    // 7) Pivot pro custom poplatky + override
    const allCustomNames = obligations.flatMap(o => {
      const arr = Array.isArray(o.custom_charges) ? o.custom_charges : []
      return arr.filter(isCustomCharge).filter(c => c.enabled).map(c => c.name)
    })
    const customNames = Array.from(new Set(allCustomNames))

    const customMatrix = customNames.map(name => {
      const values: (number | '')[] = months.map(({ year, month }) => {
        const o = obligations.find(x => x.year === year && x.month === month)
        let base: number | '' = ''
        if (o) {
          const arr = Array.isArray(o.custom_charges) ? o.custom_charges : []
          const found = arr.filter(isCustomCharge).find(c => c.name === name && c.enabled)
          base = found ? found.amount : ''
        }
        const ov = overrides.find(o =>
          o.charge_id === name && o.year === year && o.month === month
        )
        return ov?.override_val ?? base
      })

      const total = values.reduce<number>(
        (sum, v) => sum + (typeof v === 'number' ? v : 0),
        0
      )

      return { id: name, name, values, total }
    })

    // 8) Vrať JSON
    return NextResponse.json({
      paymentsMatrix: {
        months,
        data: [...matrixData, ...customMatrix]
      },
      overrides
    })
  }
  catch (err) {
    console.error('Chyba v /api/statement:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
