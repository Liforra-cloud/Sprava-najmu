// app/api/statement/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type { MonthlyObligation } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// --- 1) Typy pro práci s rokem/měsíc ---
type YearMonth = { year: number; month: number }
function parseYm(ym: string): YearMonth {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m }
}
function getMonthsInRange(from: YearMonth, to: YearMonth): YearMonth[] {
  const months: YearMonth[] = []
  let y = from.year, m = from.month
  while (y < to.year || (y === to.year && m <= to.month)) {
    months.push({ year: y, month: m })
    m += 1
    if (m > 12) { m = 1; y += 1 }
  }
  return months
}

// --- 2) Typ a kontrola pro vlastní poplatky ---
type CustomCharge = { name: string; amount: number; enabled: boolean }
function isCustomCharge(x: unknown): x is CustomCharge {
  if (typeof x !== 'object' || x === null) return false
  const obj = x as Record<string, unknown>
  return (
    typeof obj.name === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.enabled === 'boolean'
  )
}

// --- 3) Typ pro POST tělo (uložení vyúčtování) ---
interface StatementSaveRequest {
  unitId: string
  from:   string         // "YYYY-MM"
  to:     string         // "YYYY-MM"
  actuals?: Record<string, number | "">
}

// --- 4) Definice polí pro standardní poplatky ---
type AmountField =
  | 'rent_amount'
  | 'monthly_electricity'
  | 'monthly_water'
  | 'monthly_gas'
  | 'monthly_services'
  | 'repair_fund'

const standardKeys: Array<{
  id: string
  label: string
  field: AmountField
  flag: keyof MonthlyObligation
}> = [
  { id: 'rent',        label: 'Nájem',      field: 'rent_amount',        flag: 'rent_amount' },
  { id: 'electricity', label: 'Elektřina',  field: 'monthly_electricity', flag: 'monthly_electricity' },
  { id: 'water',       label: 'Voda',       field: 'monthly_water',       flag: 'monthly_water' },
  { id: 'gas',         label: 'Plyn',       field: 'monthly_gas',         flag: 'monthly_gas' },
  { id: 'services',    label: 'Služby',     field: 'monthly_services',    flag: 'monthly_services' },
  { id: 'repair_fund', label: 'Fond oprav', field: 'repair_fund',         flag: 'repair_fund' }
]

// --- GET: náhled vyúčtování podle unitId, from, to ---
export async function GET(req: NextRequest) {
  const url    = new URL(req.url)
  const unitId = url.searchParams.get('unitId')
  const from   = url.searchParams.get('from')
  const to     = url.searchParams.get('to')

  if (!unitId || !from || !to) {
    return NextResponse.json(
      { error: 'unitId, from i to jsou povinné' },
      { status: 400 }
    )
  }

  // 1) Najít lease
  const fromYm = parseYm(from)
  const toYm   = parseYm(to)
  const lease = await prisma.lease.findFirst({
    where: {
      unit_id: unitId,
      start_date: { lte: new Date(`${toYm.year}-${String(toYm.month).padStart(2,'0')}-01`) },
      OR: [
        { end_date: null },
        { end_date: { gte: new Date(`${fromYm.year}-${String(fromYm.month).padStart(2,'0')}-01`) } }
      ]
    }
  })
  if (!lease) {
    return NextResponse.json(
      { error: 'Pro danou jednotku a období neexistuje nájemní smlouva' },
      { status: 404 }
    )
  }

  // 2) Načíst povinnosti a override
  const obligations  = await prisma.monthlyObligation.findMany({
    where: {
      lease_id: lease.id,
      OR: [
        { year: fromYm.year, month: { gte: fromYm.month } },
        { year: toYm.year,   month: { lte: toYm.month } },
        { year: { gt: fromYm.year, lt: toYm.year } }
      ]
    }
  })
  const rawOverrides = await prisma.statementEntry.findMany({
    where: { lease_id: lease.id }
  })
  const overrideMap: Record<string, number | null> = {}
  rawOverrides.forEach(o => {
    overrideMap[`${o.year}-${o.month}-${o.charge_id}`] =
      o.override_val === null ? null : Number(o.override_val)
  })

  // 3) Sestavit matici plateb
  const months = getMonthsInRange(fromYm, toYm)
  const matrixStandard = standardKeys.map(key => {
    const values = months.map(({ year, month }) => {
      const obl = obligations.find(o => o.year === year && o.month === month)
      const flags = (obl?.charge_flags as Record<string, boolean> | null) ?? {}
      const base =
        obl && flags[key.flag] && typeof obl[key.field] === 'number'
          ? (obl[key.field] as number)
          : 0
      const ov = overrideMap[`${year}-${month}-${key.id}`]
      return ov != null ? ov : base
    })
    return { id: key.id, name: key.label, values, total: values.reduce((a,b) => a+b, 0) }
  })

  // 4) Vlastní poplatky
  const allNames = obligations
    .flatMap(o => Array.isArray(o.custom_charges) ? o.custom_charges : [])
    .filter(isCustomCharge)
    .filter(c => c.enabled)
    .map(c => c.name)
  const customKeys = Array.from(new Set(allNames))
  const matrixCustom = customKeys.map(name => {
    const values = months.map(({ year, month }) => {
      const obl = obligations.find(o => o.year === year && o.month === month)
      const base =
        obl && Array.isArray(obl.custom_charges)
          ? (obl.custom_charges as CustomCharge[]).find(c => c.name===name && c.enabled)?.amount ?? 0
          : 0
      const ov = overrideMap[`${year}-${month}-${name}`]
      return ov != null ? ov : base
    })
    return { id: name, name, values, total: values.reduce((a,b) => a+b, 0) }
  })

  // 5) Výsledek
  const paymentsMatrix = { months, data: [...matrixStandard, ...matrixCustom] }
  const tenant = await prisma.tenant.findUnique({ where: { id: lease.tenant_id } })

  return NextResponse.json({
    paymentsMatrix,
    tenant: tenant ? { full_name: tenant.full_name } : null
  })
}

// --- POST: ukládání vyúčtování ---
export async function POST(req: NextRequest) {
  const { unitId, from, to, actuals = {} } =
    (await req.json()) as StatementSaveRequest

  if (!unitId || !from || !to) {
    return NextResponse.json(
      { error: 'unitId, from i to jsou povinné' },
      { status: 400 }
    )
  }

  // 1) Lease
  const fromYm = parseYm(from)
  const toYm   = parseYm(to)
  const lease = await prisma.lease.findFirst({
    where: {
      unit_id: unitId,
      start_date: { lte: new Date(`${toYm.year}-${String(toYm.month).padStart(2,'0')}-01`) },
      OR: [
        { end_date: null },
        { end_date: { gte: new Date(`${fromYm.year}-${String(fromYm.month).padStart(2,'0')}-01`) } }
      ]
    }
  })
  if (!lease) {
    return NextResponse.json(
      { error: 'Pro danou jednotku a období neexistuje nájemní smlouva' },
      { status: 404 }
    )
  }

  // 2) Povinnosti + override (stejně jako v GET)
  const obligations  = await prisma.monthlyObligation.findMany({ /* ... */ })
  const rawOverrides = await prisma.statementEntry.findMany({ where: { lease_id: lease.id } })
  const overrideMap: Record<string, number|null> = {}
  rawOverrides.forEach(o => {
    overrideMap[`${o.year}-${o.month}-${o.charge_id}`] =
      o.override_val === null ? null : Number(o.override_val)
  })

  // 3) Měsíce
  const months = getMonthsInRange(fromYm, toYm)

  // 4) Matice standardních + custom poplatků (kopie z GET)
  //    [ Vložte sem stejnou logiku matrixStandard a matrixCustom jako výše ]

  const paymentsMatrix = { months, data: [ /* ... */ ] }

  // 5) Souhrnné položky
  type SummaryItem = { id:string; name:string; total:number; actual:number; diff:number }
  const summaryItems: SummaryItem[] = paymentsMatrix.data.map(row => {
    const total = row.values.reduce((sum, v) => {
      const key = `${months[row.values.indexOf(v)].year}-${months[row.values.indexOf(v)].month}-${row.id}`
      // ignore ov=null entries
      return overrideMap[key] === null ? sum : sum + v
    }, 0)
    const actual = actuals[row.id] !== undefined && actuals[row.id] !== ''
      ? Number(actuals[row.id])
      : total
    return {
      id:    row.id,
      name:  row.name,
      total,
      actual,
      diff:  actual - total
    }
  })

  const totalCosts  = summaryItems.reduce((s,i) => s + i.total,  0)
  const totalActual = summaryItems.reduce((s,i) => s + i.actual, 0)
  const balance     = totalActual - totalCosts

  // 6) Titulek
  const pad = (n:number) => String(n).padStart(2,'0')
  const title = (fromYm.year===toYm.year && fromYm.month===1 && toYm.month===12)
    ? `Vyúčtování ${fromYm.year}`
    : `Vyúčtování ${pad(fromYm.month)}/${fromYm.year}–${pad(toYm.month)}/${toYm.year}`

  // 7) Uložení
  const newStmt = await prisma.statementEntry.create({
    data: {
      unit_id:       lease.unit_id,
      lease_id:      lease.id,
      period_from:   new Date(`${fromYm.year}-${pad(fromYm.month)}-01`),
      period_to:     new Date(`${toYm.year}-${pad(toYm.month)}-01`),
      data:          paymentsMatrix,
      year:          0,
      month:         0,
      charge_id:     '',
      override_val:  null,
      note:          null,
      title,
      annual_summary: {
        totalCosts,
        totalActual,
        balance,
        items: summaryItems
      }
    }
  })

  return NextResponse.json({ id: newStmt.id })
}
