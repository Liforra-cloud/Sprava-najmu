// app/api/statement/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// --- Typ pro custom poplatek + type-guard ---
type CustomCharge = {
  name: string
  amount: number
  enabled: boolean
}
function isCustomCharge(x: unknown): x is CustomCharge {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.name === 'string' &&
    typeof r.amount === 'number' &&
    typeof r.enabled === 'boolean'
  )
}

// --- Typ pro override z DB ---
export type Override = {
  leaseId:    string
  year:       number
  month:      number
  chargeId:   string    // id poplatku, nebo '' pro poznámku
  overrideVal?: number
  note?:       string
}

// --- Parsování YYYY-MM ---
function parseYm(ym: string) {
  const [year, month] = ym.split('-').map(Number)
  return { year, month }
}

// --- Generování seznamu měsíců --}}
function getMonthsInRange(
  fromObj: { year: number; month: number },
  toObj:   { year: number; month: number }
): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = []
  let y = fromObj.year, m = fromObj.month
  while (y < toObj.year || (y === toObj.year && m <= toObj.month)) {
    months.push({ year: y, month: m })
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
        { error: 'unitId, from a to jsou povinné parametry' },
        { status: 400 }
      )
    }

    const fromObj = parseYm(from)
    const toObj   = parseYm(to)

    // 1) Načti všechna lease pro danou jednotku
    const leases = await prisma.lease.findMany({
      where: { unit_id: unitId }
    })
    const leaseIds = leases.map(l => l.id)

    // 2) Načti monthlyObligation v období
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

    // 3) Načti statementEntry a převést do našeho tvaru
    const raw = await prisma.statementEntry.findMany({
      where: { lease_id: { in: leaseIds } }
    })
    const overrides: Override[] = raw.map(e => ({
      leaseId:    e.lease_id,
      year:       e.year,
      month:      e.month,
      chargeId:   e.charge_id,
      overrideVal: e.override_val ?? undefined,
      note:        e.note        ?? undefined
    }))

    // 4) Seznam měsíců
    const months = getMonthsInRange(fromObj, toObj)

    // 5) Standardní poplatky
    const chargeKeys = [
      { id: 'rent',        label: 'Nájem',      flag: 'rent_amount'         },
      { id: 'electricity', label: 'Elektřina',  flag: 'monthly_electricity' },
      { id: 'water',       label: 'Voda',       flag: 'monthly_water'       },
      { id: 'gas',         label: 'Plyn',       flag: 'monthly_gas'         },
      { id: 'services',    label: 'Služby',     flag: 'monthly_services'    },
      { id: 'repair_fund', label: 'Fond oprav', flag: 'repair_fund'         }
    ]

    // 6) Pivot pro standardní poplatky + override
    const matrixData = chargeKeys.map(key => {
      // sestav pole původních i přepsaných hodnot
      const values: (number | '')[] = months.map(({ year, month }) => {
        const o = obligations.find(x => x.year === year && x.month === month)
        const flags = (o?.charge_flags as Record<string, boolean>) ?? {}
        // základní
        let base: number | '' = ''
        if (o && flags[key.flag]) {
          switch (key.id) {
            case 'rent':        base = o.rent;        break
            case 'electricity': base = o.electricity; break
            case 'water':       base = o.water;       break
            case 'gas':         base = o.gas;         break
            case 'services':    base = o.services;    break
            case 'repair_fund': base = o.repair_fund; break
          }
        }
        // override
        const ov = overrides.find(r =>
          r.leaseId  === unitId &&
          r.chargeId === key.id   &&
          r.year     === year     &&
          r.month    === month
        )
        return ov?.overrideVal ?? base
      })

      // total jen na číslech
      const numeric = values.map(v => typeof v === 'number' ? v : 0)
      const total   = numeric.reduce((sum, curr) => sum + curr, 0)

      return {
        id:    key.id,
        name:  key.label,
        values,
        total
      }
    })

    // 7) Pivot pro custom poplatky + override
    const allCustom = obligations.flatMap(o => {
      const arr = Array.isArray(o.custom_charges) ? o.custom_charges : []
      return arr.filter(isCustomCharge)
                .filter(c => c.enabled)
                .map(c => c.name)
    })
    const customNames = Array.from(new Set(allCustom))
    const customMatrix = customNames.map(name => {
      const values: (number | '')[] = months.map(({ year, month }) => {
        const o = obligations.find(x => x.year === year && x.month === month)
        let base: number | '' = ''
        if (o) {
          const arr = Array.isArray(o.custom_charges) ? o.custom_charges : []
          const found = arr.filter(isCustomCharge)
                           .find(c => c.name === name && c.enabled)
          base = found ? found.amount : ''
        }
        const ov = overrides.find(r =>
          r.leaseId  === unitId &&
          r.chargeId === name   &&
          r.year     === year   &&
          r.month    === month
        )
        return ov?.overrideVal ?? base
      })

      const numeric = values.map(v => typeof v === 'number' ? v : 0)
      const total   = numeric.reduce((sum, curr) => sum + curr, 0)

      return { id: name, name, values, total }
    })

    // 8) Vraťme data
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
