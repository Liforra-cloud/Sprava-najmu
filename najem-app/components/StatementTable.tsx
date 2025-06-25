// components/StatementTable.tsx

'use client'
import { useEffect, useState } from 'react'
import type { Override } from '@/app/api/statement/route'

type MatrixRow = {
  id: string
  name: string
  values: (number | '')[]
  total: number
}
type PaymentsMatrix = {
  months: { year: number; month: number }[]
  data:   MatrixRow[]
}

type CellKey  = `${number}-${number}-${string}`  // "2025-03-rent"
type MonthKey = `${number}-${number}`            // "2025-03"

export default function StatementTable({
  unitId,
  from,
  to
}: {
  unitId: string
  from:   string
  to:     string
}) {
  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [months,      setMonths]      = useState<PaymentsMatrix['months']>([])
  const [items,       setItems]       = useState<any[]>([])  // upravte podle potřeby
  const [loading,     setLoading]     = useState(true)
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({})
  const [monthNotes,  setMonthNotes]  = useState<Record<MonthKey, string>>({})

  useEffect(() => {
    if (!unitId) { setLoading(false); return }
    setLoading(true)
    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: {
        paymentsMatrix: PaymentsMatrix
        overrides:      Override[]
      }) => {
        const pm = data.paymentsMatrix
        setMatrix(pm)
        setMonths(pm.months)

        // horní tabulka – jen příklad, upravte podle skutečného typu
        setItems(pm.data.map(r => ({
          id: r.id,
          name: r.name,
          totalAdvance: r.total,
          consumption: '',
          unit: '',
          totalCost: '',
          diff: 0,
          chargeableMonths: [],
        })))

        // pivotní hodnoty + overrides
        const pv: Record<CellKey, number | ''> = {}
        pm.data.forEach(r => {
          pm.months.forEach(m => {
            const key = `${m.year}-${m.month}-${r.id}` as CellKey
            const baseIdx = pm.months.findIndex(x => x.year === m.year && x.month === m.month)
            const base = r.values[baseIdx]
            const ov = data.overrides.find(o =>
              o.leaseId === unitId &&
              o.chargeId === r.id &&
              o.year === m.year &&
              o.month === m.month
            )
            pv[key] = ov?.overrideVal ?? base
          })
        })
        setPivotValues(pv)

        // poznámky
        const mn: Record<MonthKey, string> = {}
        pm.months.forEach(m => {
          const mk = `${m.year}-${m.month}` as MonthKey
          const ov = data.overrides.find(o =>
            o.leaseId === unitId &&
            o.chargeId === '' &&
            o.year === m.year &&
            o.month === m.month
          )
          mn[mk] = ov?.note ?? ''
        })
        setMonthNotes(mn)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [unitId, from, to])

  if (loading) return <div>Načítám…</div>
  if (!matrix) return <div>Chyba načtení dat</div>

  // ukládací handlery
  const saveCell = (year:number, month:number, id:string) => {
    const key = `${year}-${month}-${id}` as CellKey
    const val = pivotValues[key] === '' ? 0 : pivotValues[key]
    fetch('/api/statement/new', {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ leaseId: unitId, year, month, chargeId: id, overrideVal: val })
    })
  }
  const saveNote = (year:number, month:number) => {
    const key = `${year}-${month}` as MonthKey
    fetch('/api/statement/new', {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ leaseId: unitId, year, month, chargeId: '', note: monthNotes[key] })
    })
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold">Vyúčtování za období</h1>
      {/* Vaše tabulky zde... */}
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Měsíc/Rok</th>
            {matrix.data.map(r => (
              <th key={r.id} className="p-2 border text-center">{r.name}</th>
            ))}
            <th className="p-2 border">Poznámka</th>
          </tr>
        </thead>
        <tbody>
          {months.map(m => {
            const mk = `${m.year}-${m.month}` as MonthKey
            return (
              <tr key={mk}>
                <td className="border p-1">{`${String(m.month).padStart(2,'0')}/${m.year}`}</td>
                {matrix.data.map(r => {
                  const ck = `${m.year}-${m.month}-${r.id}` as CellKey
                  return (
                    <td key={ck} className="border p-1">
                      <input
                        type="number"
                        value={pivotValues[ck]}
                        onChange={e => {
                          const v = e.target.value
                          const num = v === '' ? '' : Number(v)
                          setPivotValues(pv => ({ ...pv, [ck]: num }))
                        }}
                        onBlur={() => saveCell(m.year, m.month, r.id)}
                        className="w-full text-center"
                        min={0}
                      />
                    </td>
                  )
                })}
                <td className="border p-1">
                  <textarea
                    rows={2}
                    value={monthNotes[mk]}
                    onChange={e => setMonthNotes(mn => ({ ...mn, [mk]: e.target.value }))}
                    onBlur={() => saveNote(m.year, m.month)}
                    className="w-full border rounded px-1 py-1"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
