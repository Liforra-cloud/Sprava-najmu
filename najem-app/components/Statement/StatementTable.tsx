// components/Statement/StatementTable.tsx

'use client'

import React, { useEffect, useState } from 'react'

export type MatrixRow = {
  id: string
  name: string
  values: (number | '')[]
  total: number
}

export type PaymentsMatrix = {
  months: { year: number; month: number }[]
  data: MatrixRow[]
}

export type CellKey = `${number}-${number}-${string}`

type OverrideEntry = {
  lease_id: string
  year: number
  month: number
  charge_id: string
  override_val: number | null
  note: string | null
}

export default function StatementTable({
  unitId,
  from,
  to,
  onDataChange,
}: {
  unitId: string
  from: string
  to: string
  onDataChange?: (
    matrix: PaymentsMatrix,
    pivotValues: Record<CellKey, number | ''>,
    chargeFlags: Record<CellKey, boolean>
  ) => void
}) {
  const [matrix, setMatrix] = useState<PaymentsMatrix | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({})
  const [chargeFlags, setChargeFlags] = useState<Record<CellKey, boolean>>({})

  useEffect(() => {
    if (!unitId) {
      setMatrix(null)
      return
    }
    setLoading(true)
    setError(null)
    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json() as Promise<{ paymentsMatrix: PaymentsMatrix; overrides: OverrideEntry[] }>
      })
      .then(({ paymentsMatrix: pm, overrides }) => {
        setMatrix(pm)
        const pv: Record<CellKey, number | ''> = {}
        const cf: Record<CellKey, boolean> = {}
        pm.data.forEach(row => {
          pm.months.forEach(({ year, month }, idx) => {
            const ck = `${year}-${month}-${row.id}` as CellKey
            const base = row.values[idx] ?? 0
            const ov = overrides.find(o =>
              o.lease_id === unitId &&
              o.charge_id === row.id &&
              o.year === year &&
              o.month === month
            )
            pv[ck] = ov?.override_val ?? base
            cf[ck] = ov != null ? ov.override_val !== null : true
          })
        })
        setPivotValues(pv)
        setChargeFlags(cf)
        onDataChange?.(pm, pv, cf)
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [unitId, from, to, onDataChange])

  if (loading) return <div>Načítám…</div>
  if (error) return <div className="text-red-600">Chyba: {error}</div>
  if (!matrix) return <div>Vyberte jednotku a období.</div>

  // Přidání nového poplatku (sloupec)
  const addColumn = () => {
    const name = window.prompt('Název nového poplatku:')
    if (!name) return
    const id = name.trim().replace(/\s+/g, '_')
    if (matrix.data.find(r => r.id === id)) {
      alert('Tento poplatek už existuje.')
      return
    }
    const newRow: MatrixRow = {
      id,
      name,
      values: matrix.months.map(() => 0),
      total: 0
    }
    setMatrix(prev => {
      if (!prev) return prev
      const next: PaymentsMatrix = { months: prev.months, data: [...prev.data, newRow] }
      onDataChange?.(next, pivotValues, chargeFlags)
      return next
    })
    setPivotValues(old => {
      const next: Record<CellKey, number | ''> = { ...old }
      matrix.months.forEach(({ year, month }) => {
        next[`${year}-${month}-${id}` as CellKey] = 0
      })
      return next
    })
    setChargeFlags(old => {
      const next: Record<CellKey, boolean> = { ...old }
      matrix.months.forEach(({ year, month }) => {
        next[`${year}-${month}-${id}` as CellKey] = true
      })
      return next
    })
  }

  // Odebrání sloupce (poplatku)
  const removeColumn = (id: string) => {
    if (!window.confirm(`Opravdu smazat poplatek "${id}"?`)) return
    setMatrix(prev => {
      if (!prev) return prev
      const next: PaymentsMatrix = {
        months: prev.months,
        data: prev.data.filter(r => r.id !== id)
      }
      onDataChange?.(next, pivotValues, chargeFlags)
      return next
    })
    setPivotValues(old => {
      const next: Record<CellKey, number | ''> = { ...old }
      Object.keys(next).forEach(k => {
        if (k.endsWith(`-${id}`)) delete next[k as CellKey]
      })
      return next
    })
    setChargeFlags(old => {
      const next: Record<CellKey, boolean> = { ...old }
      Object.keys(next).forEach(k => {
        if (k.endsWith(`-${id}`)) delete next[k as CellKey]
      })
      return next
    })
  }

  // Přepnutí účtovat/neúčtovat
  const toggleCharge = (ck: CellKey) => {
    setChargeFlags(prev => {
      const next: Record<CellKey, boolean> = { ...prev, [ck]: !prev[ck] }
      const [y, m, ...rest] = ck.split('-')
      const year = Number(y)
      const month = Number(m)
      const chargeId = rest.join('-')
      const val = next[ck] ? (pivotValues[ck] === '' ? 0 : pivotValues[ck]) : null
      fetch('/api/statement/new', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId: unitId, year, month, chargeId, overrideVal: val })
      })
      onDataChange?.(matrix!, pivotValues, next)
      return next
    })
  }

  // Uložení hodnoty
  const saveCell = (ck: CellKey) => {
    if (!chargeFlags[ck]) return
    const [y, m, ...rest] = ck.split('-')
    const year = Number(y)
    const month = Number(m)
    const chargeId = rest.join('-')
    const val = pivotValues[ck] === '' ? 0 : pivotValues[ck]
    fetch('/api/statement/new', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaseId: unitId, year, month, chargeId, overrideVal: val })
    })
  }

  // --- RENDER ---

  return (
    <div className="overflow-x-auto border rounded-lg">
      <button
        onClick={addColumn}
        className="mb-2 px-2 py-1 bg-blue-600 text-white rounded"
      >
        Přidat poplatek
      </button>
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Měsíc/Rok</th>
            {matrix.data.map(r => (
              <th key={r.id} className="border p-2 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <span>{r.name}</span>
                  <button
                    onClick={() => removeColumn(r.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Odebrat poplatek"
                    style={{ lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.months.map(({ year, month }) => (
            <tr key={`${year}-${month}`}>
              <td className="border p-2">{`${String(month).padStart(2, '0')}/${year}`}</td>
              {matrix.data.map(r => {
                const ck = `${year}-${month}-${r.id}` as CellKey
                const enabled = chargeFlags[ck]
                const val = pivotValues[ck]
                return (
                  <td key={ck} className="border p-2 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <input
                        type="number"
                        value={val}
                        disabled={!enabled}
                        onChange={e => {
                          const num = e.target.value === '' ? '' : Number(e.target.value)
                          setPivotValues(prev => {
                            const next: Record<CellKey, number | ''> = { ...prev, [ck]: num }
                            return next
                          })
                        }}
                        onBlur={() => saveCell(ck)}
                        className={`w-16 text-right text-xs border rounded px-1 py-0 ${!enabled ? 'opacity-50' : ''}`}
                        min={0}
                      />
                      <span
                        className={`inline-block w-3 h-3 rounded-full cursor-pointer transition ${enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                        title={enabled ? 'Účtuje se' : 'Neúčtuje se'}
                        onClick={() => toggleCharge(ck)}
                      />
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
