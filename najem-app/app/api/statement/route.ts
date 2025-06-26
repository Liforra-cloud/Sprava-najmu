// app/api/statement/route.ts

import { NextRequest, NextResponse } from 'next/server'
import type { MonthlyObligation, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/** Override záznam */
type OverrideEntry = {
  lease_id:     string
  year:         number
  month:        number
  charge_id:    string
  override_val: number | null
  note:         string | null
}

/** Custom poplatek uložený v JSON poli */
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

function parseYm(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m }
}

function getMonthsInRange(
  from: { year: number; month: number },
  to:   { year: number; month: number }
) {
  const months: { year: number; month: number }[] = []
  let y = from.year, mo = from.month
  while (y < to.year || (y === to.year && mo <= to.month)) {
    months.push({ year: y, month: mo })
    mo++
    if (mo > 12) { mo = 1; y++ }
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

  // 1) Parsování období
  const fromObj = parseYm(from)
  const toObj   = parseYm(to)
  const months  = getMonthsInRange(fromObj, toObj)

  // 2) Najdi aktivní lease pro jednotku v daném období
  const lease = await prisma.lease.findFirst({
    where: {
      unit_id: unitId,
      start_date: {
        lte: new Date(`${toObj.year}-${String(toObj.month).padStart(2,'0')}-01`)
      },
      OR: [
        { end_date: null },
        { end_date: { gte: new Date(`${fromObj.year}-${String(fromObj.month).padStart(2,'0')}-01`) } }
      ]
    }
  })
  if (!lease) {
    return NextResponse.json(
      { error: 'Pro tuto jednotku není žádná platná smlouva v zadaném období' },
      { status: 404 }
    )
  }

  // 3) Informace o nájemníkovi
  const tenant = await prisma.tenant.findUnique({
    where: { id: lease.tenant_id }
  })

  // 4) Načti monthlyObligations
  const obligations = await prisma.monthlyObligation.findMany({
    where: {
      lease_id: lease.id,
      OR: [
        { year: fromObj.year,                month: { gte: fromObj.month } },
        { year: toObj.year,                  month: { lte: toObj.month } },
        { year: { gt: fromObj.year, lt: toObj.year } }
      ]
    }
  })

  // 5) Načti overrides (statementEntry)
  const rawOverrides = await prisma.statementEntry.findMany({
    where: { lease_id: lease.id }
  })
  const overrides: OverrideEntry[] = rawOverrides.map(o => ({
    lease_id:     o.lease_id!,
    year:         o.year,
    month:        o.month,
    charge_id:    o.charge_id,
    override_val: o.override_val === null
      ? null
      : (o.override_val as Prisma.Decimal).toNumber(),
    note:         o.note
  }))

  // 6) Definice standardních poplatků
  type MatrixRow = { id:string; name:string; values:(number|'')[]; total:number }
  const standardKeys: {
    id: string
    label: string
    field: keyof MonthlyObligation
    flag: string
  }[] = [
    { id:'rent',        label:'Nájem',      field:'rent',        flag:'rent_amount'         },
    { id:'electricity', label:'Elektřina',  field:'electricity', flag:'monthly_electricity' },
    { id:'water',       label:'Voda',       field:'water',       flag:'monthly_water'       },
    { id:'gas',         label:'Plyn',       field:'gas',         flag:'monthly_gas'         },
    { id:'services',    label:'Služby',     field:'services',    flag:'monthly_services'    },
    { id:'repair_fund', label:'Fond oprav', field:'repair_fund', flag:'repair_fund'         }
  ]

  const matrixData: MatrixRow[] = standardKeys.map(key => {
    const values = months.map(({ year, month }) => {
      const obl   = obligations.find(o => o.year === year && o.month === month)
      const flags = (obl?.charge_flags as Record<string, boolean> | null) ?? {}
      const base  = obl && flags[key.flag] && typeof obl[key.field] === 'number'
        ? (obl[key.field] as number)
        : 0

      const ov = overrides.find(o =>
        o.lease_id  === lease.id &&
        o.year      === year      &&
        o.month     === month     &&
        o.charge_id === key.id
      )
      return ov?.override_val ?? base
    })
    return {
      id:    key.id,
      name:  key.label,
      values,
      total: values.reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
    }
  })

  // 7) Připrav custom poplatky
  const allCustomNames = obligations.flatMap(o => {
    const raw = Array.isArray(o.custom_charges)
      ? (o.custom_charges as unknown[])
      : []
    return raw
      .filter(isCustomCharge)
      .filter(c => c.enabled)
      .map(c => c.name)
  })
  const customNames = Array.from(new Set(allCustomNames))

  const customData: MatrixRow[] = customNames.map(name => {
    const values = months.map(({ year, month }) => {
      const obl = obligations.find(o => o.year === year && o.month === month)
      const raw = obl && Array.isArray(obl.custom_charges)
        ? (obl.custom_charges as unknown[])
        : []
      const base = raw
        .filter(isCustomCharge)
        .find(c => c.name === name && c.enabled)
        ?.amount ?? 0

      const ov = overrides.find(o =>
        o.lease_id  === lease.id &&
        o.year      === year      &&
        o.month     === month     &&
        o.charge_id === name
      )
      return ov?.override_val ?? base
    })
    return {
      id:    name,
      name,
      values,
      total: values.reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
    }
  })

  // 8) Odešli odpověď
  const paymentsMatrix = { months, data: [...matrixData, ...customData] }
  return NextResponse.json({
    paymentsMatrix,
    overrides,
    tenant: tenant
      ? { full_name: tenant.full_name, lease_end: lease.end_date }
      : null
  })
}
