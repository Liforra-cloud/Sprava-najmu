// app/api/statement/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Pomocné funkce na zpracování roku-měsíce
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
// Typ pro vlastní poplatky
type CustomCharge = { name: string; amount: number; enabled: boolean }
function isCustomCharge(x: any): x is CustomCharge {
  return x && typeof x.name === 'string' && typeof x.amount === 'number' && typeof x.enabled === 'boolean'
}

// Metoda GET – vrací seznam uložených vyúčtování
export async function GET() {
  // Najít všechny záznamy vyúčtování, které mají vyplněný title (ignorujeme dílčí override záznamy, kde title = '')
  const entries = await prisma.statementEntry.findMany({
    where: { NOT: { title: '' } },
    orderBy: { created_at: 'desc' }
  })
  // Pro každé vyúčtování doplnit jméno nájemníka a identifikátor jednotky
  const list = []
  for (const st of entries) {
    const lease = await prisma.lease.findUnique({ where: { id: st.lease_id } })
    const tenant = lease ? await prisma.tenant.findUnique({ where: { id: lease.tenant_id } }) : null
    const unit = await prisma.unit.findUnique({ where: { id: st.unit_id } })
    // Formátovat období jako YYYY-MM
    const fromStr = st.period_from ? `${st.period_from.getFullYear()}-${String(st.period_from.getMonth()+1).padStart(2,'0')}` : ''
    const toStr   = st.period_to   ? `${st.period_to.getFullYear()}-${String(st.period_to.getMonth()+1).padStart(2,'0')}` : ''
    // Z annual_summary (JSON) získat celkový balance a určit stav a částku
    let status = 'Vyrovnáno'
    let totalDue = 0
    if (st.annual_summary) {
      const summary = st.annual_summary as any
      const balance = summary.balance ?? 0
      if (balance > 0) {
        status = 'Doplatek'
        totalDue = balance
      } else if (balance < 0) {
        status = 'Přeplatek'
        totalDue = Math.abs(balance)
      }
    }
    list.push({
      id: st.id,
      title: st.title,
      from_month: fromStr,
      to_month: toStr,
      unit_identifier: unit?.identifier || '(jednotka)',
      tenant_name: tenant?.full_name || '(nájemník)',
      status: status,
      total_due: totalDue,
      created_at: st.created_at
    })
  }
  return NextResponse.json(list)
}

// Metoda POST – uloží nové vyúčtování do DB
export async function POST(req: NextRequest) {
  const { unitId, from, to, actuals } = await req.json()
  if (!unitId || !from || !to) {
    return NextResponse.json({ error: 'Chybí unitId nebo období' }, { status: 400 })
  }
  // Najít lease podle unitId a období
  const fromObj = parseYm(from)
  const toObj   = parseYm(to)
  const lease = await prisma.lease.findFirst({
    where: {
      unit_id: unitId,
      start_date: { lte: new Date(`${toObj.year}-${String(toObj.month).padStart(2,'0')}-01`) },
      OR: [
        { end_date: null },
        { end_date: { gte: new Date(`${fromObj.year}-${String(fromObj.month).padStart(2,'0')}-01`) } }
      ]
    }
  })
  if (!lease) {
    return NextResponse.json({ error: 'Pro danou jednotku a období neexistuje nájemní smlouva' }, { status: 404 })
  }
  // Načíst měsíční povinnosti v daném období
  const obligations = await prisma.monthlyObligation.findMany({
    where: {
      lease_id: lease.id,
      OR: [
        { year: fromObj.year, month: { gte: fromObj.month } },
        { year: toObj.year,   month: { lte: toObj.month } },
        { year: { gt: fromObj.year, lt: toObj.year } }
      ]
    }
  })
  // Načíst všechny již uložené override záznamy pro danou smlouvu
  const overrides = await prisma.statementEntry.findMany({
    where: { lease_id: lease.id }
  })
  // Vytvořit mapu override hodnot pro rychlý přístup
  const overrideMap: Record<string, number|null> = {}
  for (const o of overrides) {
    const key = `${o.year}-${o.month}-${o.charge_id}`
    overrideMap[key] = o.override_val === null ? null : Number(o.override_val)
  }

  // Sestavit přehled měsíců v období
  const months = getMonthsInRange(fromObj, toObj)

  // Sestavit tabulku standardních poplatků (nájem, energie, služby, fond oprav)
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
      const base = obl && flags[key.flag] && typeof obl[key.field] === 'number'
        ? Number(obl[key.field])
        : 0
      const overrideVal = overrideMap[`${year}-${month}-${key.id}`]
      // Pokud existuje override: null znamená neúčtovat (0), jinak override hodnota
      if (overrideVal !== undefined) {
        return (overrideVal === null ? 0 : overrideVal)
      }
      return base
    })
    const total = values.reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
    return { id: key.id, name: key.label, values, total }
  })

  // Sestavit tabulku vlastních poplatků (custom charges)
  const allCustomNames: string[] = obligations.flatMap(o => {
    const list = Array.isArray(o.custom_charges) ? o.custom_charges : []
    return list.filter(isCustomCharge).filter(c => c.enabled).map(c => c.name)
  })
  const customNames = Array.from(new Set(allCustomNames))
  const customData = customNames.map(name => {
    const values = months.map(({ year, month }) => {
      const obl = obligations.find(o => o.year === year && o.month === month)
      let base = 0
      if (obl && Array.isArray(obl.custom_charges)) {
        const found = (obl.custom_charges as CustomCharge[]).find(c => c.name === name && c.enabled)
        base = found ? found.amount : 0
      }
      const overrideVal = overrideMap[`${year}-${month}-${name}`]
      return (overrideVal !== undefined ? (overrideVal === null ? 0 : overrideVal) : base)
    })
    const total = values.reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
    return { id: name, name, values, total }
  })

  // Komplexní matice plateb (měsíce + data)
  const paymentsMatrix = { months, data: [...matrixData, ...customData] }

  // Vypočítat souhrnné hodnoty za období pro každou položku
  const summaryItems = paymentsMatrix.data.map(row => {
    // Součet účtovaných záloh (po započtení override a vypnutí)
    let chargedTotal = 0
    months.forEach(({ year, month }, idx) => {
      const key = `${year}-${month}-${row.id}`
      // Pokud overrideVal === null (položka neúčtována v daném měsíci), přeskočit
      if (overrideMap[key] !== null) {
        const val = row.values[idx]
        if (typeof val === 'number') {
          chargedTotal += val
        }
      }
    })
    // Zjistit skutečnou hodnotu z inputů (nebo default na chargedTotal, pokud není zadána)
    const actualVal = (actuals && actuals[row.id] !== undefined && actuals[row.id] !== '')
      ? Number(actuals[row.id])
      : chargedTotal
    const diff = actualVal - chargedTotal
    return { id: row.id, name: row.name, total: chargedTotal, actual: actualVal, diff: diff }
  })
  // Celkové součty (vypočteno vs. skutečně, a rozdíl)
  const totalCosts = summaryItems.reduce((sum, item) => sum + item.total, 0)
  const totalActual = summaryItems.reduce((sum, item) => sum + item.actual, 0)
  const balance = totalActual - totalCosts

  // Vygenerovat název vyúčtování
  let title: string
  if (fromObj.year === toObj.year && fromObj.month === 1 && toObj.month === 12) {
    title = `Vyúčtování ${fromObj.year}`
  } else {
    const pad = (n: number) => String(n).padStart(2, '0')
    title = `Vyúčtování ${pad(fromObj.month)}/${fromObj.year}–${pad(toObj.month)}/${toObj.year}`
  }

  // Uložit nový záznam vyúčtování do tabulky statements
  const newStatement = await prisma.statementEntry.create({
    data: {
      unit_id: lease.unit_id,
      lease_id: lease.id,
      period_from: new Date(`${fromObj.year}-${String(fromObj.month).padStart(2,'0')}-01`),
      period_to: new Date(`${toObj.year}-${String(toObj.month).padStart(2,'0')}-01`),
      data: paymentsMatrix,
      year: 0,
      month: 0,
      charge_id: '',
      override_val: null,
      note: null,
      title: title,
      annual_summary: {
        totalCosts: totalCosts,
        totalActual: totalActual,
        balance: balance,
        items: summaryItems
      }
    }
  })
  return NextResponse.json({ id: newStatement.id })
}
