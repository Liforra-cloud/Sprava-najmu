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
    typeof (x as any).name === 'string' &&
    'amount' in x &&
    typeof (x as any).amount === 'number' &&
    'enabled' in x &&
    typeof (x as any).enabled === 'boolean'
  )
}

// --- Typ frontendových přepisů/poznámek ---
export type Override = {
  leaseId:    string     // lease_id
  year:       number
  month:      number
  chargeId:   string     // charge_id nebo '' pro poznámku
  overrideVal?: number   // override_val
  note?:      string     // poznámka
}

function parseYm(ym: string) {
  const [year, month] = ym.split('-').map(Number)
  return { year, month }
}

function getMonthsInRange(fromObj: {year:number;month:number}, toObj: {year:number;month:number}) {
  const months: {month:number;year:number}[] = []
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
    if (!unitId||!from||!to) {
      return NextResponse.json({ error: 'unitId, from, to jsou povinné' }, { status: 400 })
    }

    const fromObj = parseYm(from), toObj = parseYm(to)

    // 1) leidy
    const leases = await prisma.lease.findMany({ where: { unit_id: unitId } })
    const leaseIds = leases.map(l=>l.id)

    // 2) původní monthlyObligation
    const obligations = await prisma.monthlyObligation.findMany({
      where: {
        lease_id: { in: leaseIds },
        OR: [
          { year: fromObj.year, month: { gte: fromObj.month }},
          { year: toObj.year,   month: { lte: toObj.month }},
          { year: { gt: fromObj.year, lt: toObj.year }}
        ]
      }
    })

    // 3) přepisy/poznámky
    const raw = await prisma.statementEntry.findMany({
      where: { lease_id: { in: leaseIds } }
    })
    // map DB -> Override[]
    const overrides: Override[] = raw.map(e => ({
      leaseId:    e.lease_id,
      year:       e.year,
      month:      e.month,
      chargeId:   e.charge_id,
      overrideVal: e.override_val ?? undefined,
      note:       e.note ?? undefined
    }))

    // 4) seznam měsíců
    const months = getMonthsInRange(fromObj, toObj)

    // 5) standardní poplatky
    const chargeKeys = [
      { id:'rent',        label:'Nájem',      flag:'rent_amount'         },
      { id:'electricity', label:'Elektřina',  flag:'monthly_electricity' },
      { id:'water',       label:'Voda',       flag:'monthly_water'       },
      { id:'gas',         label:'Plyn',       flag:'monthly_gas'         },
      { id:'services',    label:'Služby',     flag:'monthly_services'    },
      { id:'repair_fund', label:'Fond oprav', flag:'repair_fund'         }
    ]

    // 6) pivot standard + overrides
    const matrixData = chargeKeys.map(key => {
      const values = months.map(({year,month}) => {
        const o = obligations.find(x=>x.year===year&&x.month===month)
        const flags = o?.charge_flags as Record<string,boolean>|null
        let base: number|'' = ''
        if (o && flags && flags[key.flag]) {
          base = (() => {
            switch(key.id){
              case 'rent':        return o.rent
              case 'electricity': return o.electricity
              case 'water':       return o.water
              case 'gas':         return o.gas
              case 'services':    return o.services
              case 'repair_fund': return o.repair_fund
            }
          })()
        }
        const ov = overrides.find(r=>r.chargeId===key.id && r.year===year && r.month===month)
        return ov?.overrideVal ?? base
      })
      // tady dáváme explicitní generic <number> pro typ akumulátoru:
      const total = values.reduce<number>(
        (sum,v)=> sum + (typeof v==='number'?v:0),
        0
      )
      return { id:key.id, name:key.label, values, total }
    })

    // 7) custom poplatky + overrides
    const allCustom = obligations.flatMap(o=>{
      const arr = Array.isArray(o.custom_charges)?o.custom_charges: []
      return arr.filter(isCustomCharge).filter(c=>c.enabled).map(c=>c.name)
    })
    const customNames = Array.from(new Set(allCustom))
    const customMatrix = customNames.map(name => {
      const values = months.map(({year,month}) => {
        const o = obligations.find(x=>x.year===year&&x.month===month)
        let base: number|'' = ''
        if (o) {
          const arr = Array.isArray(o.custom_charges)?o.custom_charges:[]
          const found = arr.filter(isCustomCharge).find(c=>c.name===name&&c.enabled)
          base = found? found.amount : ''
        }
        const ov = overrides.find(r=>r.chargeId===name && r.year===year&&r.month===month)
        return ov?.overrideVal ?? base
      })
      const total = values.reduce<number>(
        (sum,v)=> sum + (typeof v==='number'?v:0),
        0
      )
      return { id:name, name, values, total }
    })

    // 8) vrať JSON
    return NextResponse.json({
      paymentsMatrix: { months, data: [...matrixData, ...customMatrix] },
      overrides
    })
  }
  catch(err) {
    console.error('Chyba /api/statement:', err)
    return NextResponse.json({ error:'Server error' },{ status:500 })
  }
}
