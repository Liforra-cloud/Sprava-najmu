// app/api/statement/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// --- Typ pro custom poplatek + type guard ---
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

function parseYm(ym: string) {
  const [year, month] = ym.split('-').map(Number)
  return { year, month }
}

function getMonthsInRange(
  fromObj: { year: number; month: number },
  toObj: { year: number; month: number }
) {
  const months: { month: number; year: number }[] = []
  let y = fromObj.year
  let m = fromObj.month
  while (y < toObj.year || (y === toObj.year && m <= toObj.month)) {
    months.push({ month: m, year: y })
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return months
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
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

  // 1) Všechny lease pro dané unit
  const leases = await prisma.lease.findMany({ where: { unit_id: unitId } })
  const leaseIds = leases.map(l => l.id)

  // 2) Všechny monthly_obligation v období
  const obligations = await prisma.monthlyObligation.findMany({
    where: {
      lease_id: { in: leaseIds },
      OR: [
        { year: fromObj.year,               month: { gte: fromObj.month } },
        { year: toObj.year,                 month: { lte: toObj.month } },
        { year: { gt: fromObj.year, lt: toObj.year } }
      ]
    }
  })

  // 3) Všechny uživatelské přepisy z statementEntry
  const overrides = await prisma.statementEntry.findMany({
    where: { lease_id: { in: leaseIds } }
  })

  // 4) Seznam měsíců
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

  // 6) Pivot pro standardní poplatky s aplikací override
  const matrixData = chargeKeys.map(key => {
    const values = months.map(({ year, month }) => {
      // základní hodnota
      const o = obligations.find(x => x.year === year && x.month === month)
      const flags = o?.charge_flags as Record<string, boolean> | null
      let base = ''
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
      // hledám override
      const ov = overrides.find(e =>
        e.charge_id   === key.id &&
        e.year        === year    &&
        e.month       === month
      )
      return ov?.override_val ?? base
    })

    const total = values.reduce<number>(
      (sum, v) => sum + (typeof v === 'number' ? v : 0),
      0
    )

    return { id: key.id, name: key.label, values, total }
  })

  // 7) Pivot pro custom poplatky s override
  const allCustomNames = obligations.flatMap(o => {
    const arr = Array.isArray(o.custom_charges) ? o.custom_charges : []
    return arr.filter(isCustomCharge).filter(c => c.enabled).map(c => c.name)
  })
  const customNames = Array.from(new Set(allCustomNames))

  const customMatrix = customNames.map(name => {
    const values = months.map(({ year, month }) => {
      const o = obligations.find(x => x.year === year && x.month === month)
      let base = ''
      if (o) {
        const arr = Array.isArray(o.custom_charges) ? o.custom_charges : []
        const found = arr.filter(isCustomCharge).find(c => c.name === name && c.enabled)
        base = found ? found.amount : ''
      }
      const ov = overrides.find(e =>
        e.charge_id === name &&
        e.year      === year &&
        e.month     === month
      )
      return ov?.override_val ?? base
    })
    const total = values.reduce<number>(
      (sum, v) => sum + (typeof v === 'number' ? v : 0),
      0
    )
    return { id: name, name, values, total }
  })

  // 8) Vracím matici + raw overrides (pro front-end merge/poznámky)
  return NextResponse.json({
    paymentsMatrix: {
      months,
      data: [...matrixData, ...customMatrix]
    },
    overrides
  })
}

