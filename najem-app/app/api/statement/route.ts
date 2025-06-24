// app/api/statement/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// --- Lokální typ pro custom poplatek + type guard ---
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
  const from = url.searchParams.get('from') // '2024-01'
  const to = url.searchParams.get('to')     // '2024-12'

  if (!unitId || !from || !to) {
    return NextResponse.json(
      { error: 'unitId, from, to jsou povinné parametry' },
      { status: 400 }
    )
  }

  const fromObj = parseYm(from)
  const toObj = parseYm(to)

  // 1) Načti všechny lease pro danou jednotku
  const leases = await prisma.lease.findMany({
    where: { unit_id: unitId }
  })
  const leaseIds = leases.map(l => l.id)

  // 2) Načti všechny monthlyObligation v daném období
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

  // 3) Vygeneruj seznam měsíců
  const months = getMonthsInRange(fromObj, toObj)

  // 4) Definice standardních poplatků
  const chargeKeys = [
    { id: 'rent',         label: 'Nájem',       flag: 'rent_amount' },
    { id: 'electricity',  label: 'Elektřina',   flag: 'monthly_electricity' },
    { id: 'water',        label: 'Voda',        flag: 'monthly_water' },
    { id: 'gas',          label: 'Plyn',        flag: 'monthly_gas' },
    { id: 'services',     label: 'Služby',      flag: 'monthly_services' },
    { id: 'repair_fund',  label: 'Fond oprav',  flag: 'repair_fund' }
  ]

  // 5) Pivot pro standardní poplatky
  const matrixData = chargeKeys.map(key => {
    const values = months.map(({ month, year }) => {
      const o = obligations.find(x => x.month === month && x.year === year)
      const flags = o?.charge_flags as Record<string, boolean> | null
      return o && flags && flags[key.flag] ? o.paid_amount : ''
    })
    const total = values.reduce<number>(
      (acc, val) => acc + (typeof val === 'number' ? val : 0),
      0
    )
    return {
      id: key.id,
      name: key.label,
      values,
      total
    }
  })

  // 6) Vypiš všechny názvy custom poplatků, které jsou enabled
  const allCustomNames = obligations.flatMap(o => {
    const arr = Array.isArray(o.custom_charges) ? o.custom_charges : []
    return arr
      .filter(isCustomCharge)
      .filter(c => c.enabled)
      .map(c => c.name)
  })
  const customNames = Array.from(new Set(allCustomNames))

  // 7) Pivot pro custom poplatky
  const customMatrix = customNames.map(name => {
    const values = months.map(({ month, year }) => {
      const o = obligations.find(x => x.month === month && x.year === year)
      if (!o) return ''
      const arr = Array.isArray(o.custom_charges) ? o.custom_charges : []
      const found = arr
        .filter(isCustomCharge)
        .find(c => c.name === name && c.enabled)
      return found ? found.amount : ''
    })
    const total = values.reduce<number>(
      (acc, val) => acc + (typeof val === 'number' ? val : 0),
      0
    )
    return {
      id: name,
      name,
      values,
      total
    }
  })

  // 8) Vrať JSON pro frontend
  return NextResponse.json({
    paymentsMatrix: {
      months,
      data: [...matrixData, ...customMatrix]
    }
  })
}
