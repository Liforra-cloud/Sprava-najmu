// components/StatementTable.tsx

'use client'

import React, { useEffect, useState } from 'react'

///////////////////////////
// 1) Typy a pomocné
///////////////////////////

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

type Override = {
  lease_id:    string
  year:        number
  month:       number
  charge_id:   string
  override_val: number | null
  note:        string | null
}

type CellKey  = `${number}-${number}-${string}`
type MonthKey = `${number}-${number}`

interface StatementTableProps {
  unitId: string
  from:   string
  to:     string
}

export default function StatementTable({ unitId, from, to }: StatementTableProps) {
  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({})
  const [monthNotes,  setMonthNotes]  = useState<Record<MonthKey, string>>({})

  useEffect(() => {
    if (!unitId) {
      setMatrix(null)
      return
    }

    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const res = await fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
        if (!res.ok) {
          throw new Error(`(${res.status}) ${res.statusText}`)
        }
        const data: {
          paymentsMatrix: PaymentsMatrix
          overrides:      Override[]
        } = await res.json()

        const pm = data.paymentsMatrix
        setMatrix(pm)

        // Inicializace pivotValues
        const pv: Record<CellKey, number | ''> = {}
        for (const row of pm.data) {
          pm.months.forEach(({ year, month }, idx) => {
            const key = `${year}-${month}-${row.id}` as CellKey
            const base = row.values[idx] ?? 0
            const ov = data.overrides.find(o =>
              o.lease_id  === unitId &&
              o.charge_id === row.id &&
              o.year      === year &&
              o.month     === month
            )
            pv[key] = ov?.override_val ?? base
          })
        }
        setPivotValues(pv)

        // Inicializace monthNotes
        const mn: Record<MonthKey, string> = {}
        pm.months.forEach(({ year, month }) => {
          const mk = `${year}-${month}` as MonthKey
          const ov = data.overrides.find(o =>
            o.lease_id  === unitId &&
            o.charge_id === '' &&
            o.year      === year &&
            o.month     === month
          )
          mn[mk] = ov?.note ?? ''
        })
        setMonthNotes(mn)
      }
      catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
      finally {
        setLoading(false)
      }
    })()
  }, [unitId, from, to])

  if (loading)        return <div>Načítám…</div>
  if (error)          return <div className="text-red-600">Chyba: {error}</div>
  if (!matrix)        return <div>Chyba načtení dat</div>

  const saveCell = async (year: number, month: number, id: string) => {
    const ck  = `${year}-${month}-${id}` as CellKey
    const val = pivotValues[ck] === '' ? 0 : pivotValues[ck]
    try {
      const res = await fetch('/api/statement/new', {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          leaseId:     unitId,
          year, month,
          chargeId:    id,
          overrideVal: val
        })
      })
      if (!res.ok) throw new Error(`(${res.status}) ${res.statusText}`)
    } catch (e) {
      console.error('Chyba při ukládání hodnoty:', e)
    }
  }

  const saveNote = async (year: number, month: number) => {
    const mk = `${year}-${month}` as MonthKey
    try {
      const res = await fetch('/api/statement/new', {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          leaseId:  unitId,
          year, month,
          chargeId: '',
          note:     monthNotes[mk]
        })
      })
      if (!res.ok) throw new Error(`(${res.status}) ${res.statusText}`)
    } catch (e) {
      console.error('Chyba při ukládání poznámky:', e)
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold">Vyúčtování za období</h1>

      <h2 className="font-semibold mt-6 mb-2">Rozpis nákladů po měsících</h2>
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
          {matrix.months.map(m => {
            const mk = `${m.year}-${m.month}` as MonthKey
            return (
              <tr key={mk}>
                <td className="border p-1">
                  {`${String(m.month).padStart(2,'0')}/${m.year}`}
                </td>
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
                    onChange={e =>
                      setMonthNotes(n => ({ ...n, [mk]: e.target.value }))
                    }
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
