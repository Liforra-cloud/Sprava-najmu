// app/api/statement/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// --- Pomocné typy a funkce pro rok/měsíc ---
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

// --- Typ pro vlastní poplatky a jeho kontrola ---
type CustomCharge = { name: string; amount: number; enabled: boolean }
function isCustomCharge(x: unknown): x is CustomCharge {
  return typeof x === 'object' &&
         x !== null &&
         'name' in x && typeof (x as any).name === 'string' &&
         'amount' in x && typeof (x as any).amount === 'number' &&
         'enabled' in x && typeof (x as any).enabled === 'boolean'
}

// --- Typ pro POST tělo (uložení vyúčtování) ---
interface StatementSaveRequest {
  unitId: string
  from:   string          // "YYYY-MM"
  to:     string          // "YYYY-MM"
  actuals: Record<string, number | "">
}

// GET /api/statement — seznam uložených vyúčtování
export async function GET() {
  const entries = await prisma.statementEntry.findMany({
    where: { NOT: { title: '' } },
    orderBy: { created_at: 'desc' }
  })

  const list = []
  for (const st of entries) {
    const lease  = await prisma.lease.findUnique({   where: { id: st.lease_id } })
    const tenant = lease
      ? await prisma.tenant.findUnique({ where: { id: lease.tenant_id } })
      : null
    const unit   = await prisma.unit.findUnique({    where: { id: st.unit_id } })

    const fromStr = st.period_from
      ? `${st.period_from.getFullYear()}-${String(st.period_from.getMonth()+1).padStart(2,'0')}`
      : ''
    const toStr   = st.period_to
      ? `${st.period_to.getFullYear()}-${String(st.period_to.getMonth()+1).padStart(2,'0')}`
      : ''

    // Získat balance bez použití any
    interface MiniAnnual { balance?: unknown }
    const summary = (st.annual_summary ?? {}) as MiniAnnual
    const balanceRaw = summary.balance
    const balance = typeof balanceRaw === 'number' ? balanceRaw : 0

    let status = 'Vyrovnáno'
    let totalDue = 0
    if (balance > 0) {
      status = 'Doplatek'
      totalDue = balance
    } else if (balance < 0) {
      status = 'Přeplatek'
      totalDue = Math.abs(balance)
    }

    list.push({
      id: st.id,
      title: st.title,
      from_month:    fromStr,
      to_month:      toStr,
      unit_identifier: unit?.identifier ?? '(jednotka)',
      tenant_name:   tenant?.full_name   ?? '(nájemník)',
      status,
      total_due:     totalDue,
      created_at:    st.created_at
    })
  }

  return NextResponse.json(list)
}

// POST /api/statement — uložení nového vyúčtování
export async function POST(req: NextRequest) {
  const { unitId, from, to, actuals } = (await req.json()) as StatementSaveRequest

  if (!unitId || !from || !to) {
    return NextResponse.json(
      { error: 'unitId, from i to jsou povinné' },
      { status: 400 }
    )
  }

  // 1) Najít odpovídající lease
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

  // 2) Načíst měsíční povinnosti a existující override záznamy
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
  const overrideMap: Record<string, number|null> = {}
  rawOverrides.forEach(o => {
    const key = `${o.year}-${o.month}-${o.charge_id}`
    overrideMap[key] = o.override_val === null ? null : Number(o.override_val)
  })

  // 3) Vytvořit seznam měsíců v období
  const months = getMonthsInRange(fromYm, toYm)

  // 4) Sestavení matice základních poplatků
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
      const obl   = obligations.find(o => o.year===year && o.month===month)
      const flags = (obl?.charge_flags as Record<string, boolean> | null) ?? {}
      const base  = obl && flags[key.flag] && typeof (obl as any)[key.field] === 'number'
        ? Number((obl as any)[key.field])
        : 0
      const ov = overrideMap[`${year}-${month}-${key.id}`]
      return ov !== undefined ? (ov===null ? 0 : ov) : base
    })
    const total = values.reduce((sum, v) => sum + v, 0)
    return { id: key.id, name: key.label, values, total }
  })

  // 5) Sestavení matice vlastních poplatků
  const allCustom = obligations
    .flatMap(o => Array.isArray(o.custom_charges) ? o.custom_charges : [])
    .filter(isCustomCharge)
    .filter(c => c.enabled)
    .map(c => c.name)
  const customNames = Array.from(new Set(allCustom))
  const customData = customNames.map(name => {
    const values = months.map(({ year, month }) => {
      const obl  = obligations.find(o => o.year===year && o.month===month)
      const base = obl && Array.isArray(obl.custom_charges)
        ? (obl.custom_charges as CustomCharge[]).find(c=>c.name===name&&c.enabled)?.amount ?? 0
        : 0
      const ov = overrideMap[`${year}-${month}-${name}`]
      return ov !== undefined ? (ov===null ? 0 : ov) : base
    })
    const total = values.reduce((sum, v) => sum + v, 0)
    return { id: name, name, values, total }
  })

  const paymentsMatrix = { months, data: [...matrixData, ...customData] }

  // 6) Výpočet souhrnných položek
  type SummaryItem = { id:string; name:string; total:number; actual:number; diff:number }
  const summaryItems: SummaryItem[] = paymentsMatrix.data.map(row => {
    let chargedTotal = 0
    rows.values.forEach((val, idx) => {
      const key = `${months[idx].year}-${months[idx].month}-${row.id}`
      if (overrideMap[key] !== null) {
        chargedTotal += val
      }
    })
    const actualVal = actuals[row.id] !== undefined && actuals[row.id] !== ''
      ? Number(actuals[row.id])
      : chargedTotal
    return {
      id:    row.id,
      name:  row.name,
      total: chargedTotal,
      actual: actualVal,
      diff:  actualVal - chargedTotal
    }
  })

  const totalCosts  = summaryItems.reduce((s,i) => s + i.total,  0)
  const totalActual = summaryItems.reduce((s,i) => s + i.actual, 0)
  const balance     = totalActual - totalCosts

  // 7) Titulek vyúčtování
  const pad = (n:number) => String(n).padStart(2,'0')
  const title = (fromYm.year===toYm.year && fromYm.month===1 && toYm.month===12)
    ? `Vyúčtování ${fromYm.year}`
    : `Vyúčtování ${pad(fromYm.month)}/${fromYm.year}–${pad(toYm.month)}/${toYm.year}`

  // 8) Uložit do DB
  const newStmt = await prisma.statementEntry.create({
    data: {
      unit_id:       lease.unit_id,
      lease_id:      lease.id,
      period_from:   new Date(`${fromYm.year}-${pad(fromYm.month)}-01`),
      period_to:     new Date(`${toYm.year}-${pad(toYm.month)}-01`),
      data:          paymentsMatrix,
      year:          0, month: 0, charge_id: '', override_val: null, note: null,
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
