// app/api/statement/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// --- 1) Přesné typy pro vstupní JSON tělo POST požadavku ---
interface StatementPreviewRequest {
  unitId:    string         // ID jednotky
  from:      string         // formát "YYYY-MM"
  to:        string         // formát "YYYY-MM"
  actuals?:  Record<string, number | "">  // skutečné hodnoty (volitelné)
}

// --- 2) Typ pro položku v annual_summary ---
interface SummaryItem {
  id:     string
  name:   string
  total:  number
  actual: number
  diff:   number
}

// --- 3) Typ pro JSON sloupce annual_summary ---
interface AnnualSummary {
  totalCosts?:  number
  totalActual?: number
  balance?:     number
  items?:       SummaryItem[]
}

// --- 4) Pomocné typy a funkce pro práci s rokem/měsícem ---
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
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

// --- 5) Typ a kontrola pro vlastní poplatky ---
type CustomCharge = { name: string; amount: number; enabled: boolean }
function isCustomCharge(x: unknown): x is CustomCharge {
  return typeof x === 'object' &&
         x !== null &&
         'name' in x && typeof (x as any).name === 'string' &&
         'amount' in x && typeof (x as any).amount === 'number' &&
         'enabled' in x && typeof (x as any).enabled === 'boolean'
}

// GET /api/statement — výpis náhledu vyúčtování podle unitId, from, to
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const unitId = url.searchParams.get('unitId')
  const from    = url.searchParams.get('from')
  const to      = url.searchParams.get('to')

  if (!unitId || !from || !to) {
    return NextResponse.json({ error: 'unitId, from a to jsou povinné' }, { status: 400 })
  }

  // 1) Najít aktivní lease
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
    return NextResponse.json({ error: 'Pro danou jednotku a období neexistuje nájemní smlouva' }, { status: 404 })
  }

  // 2) Načíst měsíční povinnosti a override záznamy
  const obligations = await prisma.monthlyObligation.findMany({
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
    overrideMap[`${o.year}-${o.month}-${o.charge_id}`] = o.override_val === null ? null : Number(o.override_val)
  })

  // 3) Sestavit matici plateb
  const months = getMonthsInRange(fromYm, toYm)
  const standardKeys = [
    { id:'rent',        label:'Nájem',      field:'rent',        flag:'rent_amount' },
    { id:'electricity', label:'Elektřina',  field:'electricity', flag:'monthly_electricity' },
    { id:'water',       label:'Voda',       field:'water',       flag:'monthly_water' },
    { id:'gas',         label:'Plyn',       field:'gas',         flag:'monthly_gas' },
    { id:'services',    label:'Služby',     field:'services',    flag:'monthly_services' },
    { id:'repair_fund', label:'Fond oprav', field:'repair_fund', flag:'repair_fund' }
  ]
  const matrixData = standardKeys.map(key => {
    const values = months.map(({ year, month }) => {
      const obl = obligations.find(o => o.year === year && o.month === month)
      const flags = (obl?.charge_flags as Record<string, boolean> | null) ?? {}
      const base = obl && flags[key.flag] && typeof (obl as any)[key.field] === 'number'
        ? Number((obl as any)[key.field])
        : 0
      const ov = overrideMap[`${year}-${month}-${key.id}`]
      if (ov !== undefined) return ov === null ? 0 : ov
      return base
    })
    const total = values.reduce((sum, v) => sum + v, 0)
    return { id: key.id, name: key.label, values, total }
  })

  // vlastní poplatky
  const allCustom = obligations.flatMap(o =>
    Array.isArray(o.custom_charges) ? o.custom_charges : []
  ).filter(isCustomCharge).filter(c => c.enabled).map(c => c.name)
  const customNames = Array.from(new Set(allCustom))
  const customData = customNames.map(name => {
    const values = months.map(({ year, month }) => {
      const obl = obligations.find(o => o.year === year && o.month === month)
      const base = obl && Array.isArray(obl.custom_charges)
        ? (obl.custom_charges as CustomCharge[]).find(c => c.name === name && c.enabled)?.amount ?? 0
        : 0
      const ov = overrideMap[`${year}-${month}-${name}`]
      return ov !== undefined ? (ov === null ? 0 : ov) : base
    })
    const total = values.reduce((sum, v) => sum + v, 0)
    return { id: name, name, values, total }
  })

  const paymentsMatrix = { months, data: [...matrixData, ...customData] }

  // 4) Náhled response: zahrneme i jméno nájemníka
  const tenant = await prisma.tenant.findUnique({ where: { id: lease.tenant_id } })
  return NextResponse.json({
    paymentsMatrix,
    tenant: tenant ? { full_name: tenant.full_name } : null
  })
}

// POST /api/statements — uložení nového vyúčtování
export async function POST(req: NextRequest) {
  const body = (await req.json()) as StatementPreviewRequest
  const { unitId, from, to, actuals } = body

  if (!unitId || !from || !to) {
    return NextResponse.json({ error: 'unitId, from a to jsou povinné' }, { status: 400 })
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
    return NextResponse.json({ error: 'Pro danou jednotku a období neexistuje nájemní smlouva' }, { status: 404 })
  }

  // 2) Stejná logika načtení obligations, overrides a sestavení matrixData + customData...
  // [*STEJNÉ JAKO V GET*] – viz výše

  // 3) Výpočet souhrnných položek
  const summaryItems: SummaryItem[] = paymentsMatrix.data.map(row => {
    let chargedTotal = 0
    paymentsMatrix.months.forEach(({ year, month }, idx) => {
      const key = `${year}-${month}-${row.id}`
      if (overrideMap[key] !== null) {
        chargedTotal += row.values[idx]
      }
    })
    const actualVal = actuals && actuals[row.id] !== undefined && actuals[row.id] !== ''
      ? Number(actuals[row.id])
      : chargedTotal
    const diff = actualVal - chargedTotal
    return { id: row.id, name: row.name, total: chargedTotal, actual: actualVal, diff }
  })

  const totalCosts  = summaryItems.reduce((s, i) => s + i.total, 0)
  const totalActual = summaryItems.reduce((s, i) => s + i.actual, 0)
  const balance     = totalActual - totalCosts

  // 4) Titulek
  const pad = (n: number) => String(n).padStart(2,'0')
  const title = (fromYm.year === toYm.year && fromYm.month === 1 && toYm.month === 12)
    ? `Vyúčtování ${fromYm.year}`
    : `Vyúčtování ${pad(fromYm.month)}/${fromYm.year}–${pad(toYm.month)}/${toYm.year}`

  // 5) Uložení záznamu
  const newStatement = await prisma.statementEntry.create({
    data: {
      unit_id:      lease.unit_id,
      lease_id:     lease.id,
      period_from:  new Date(`${fromYm.year}-${pad(fromYm.month)}-01`),
      period_to:    new Date(`${toYm.year}-${pad(toYm.month)}-01`),
      data:         paymentsMatrix,
      year:         0,
      month:        0,
      charge_id:    '',
      override_val: null,
      note:         null,
      title,
      annual_summary: {
        totalCosts,
        totalActual,
        balance,
        items: summaryItems
      }
    }
  })

  return NextResponse.json({ id: newStatement.id })
}
