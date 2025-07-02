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

// Klíč buňky ve tvaru "YYYY-M-ID"
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
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({} as Record<CellKey, number | ''>)
  const [chargeFlags, setChargeFlags] = useState<Record<CellKey, boolean>>({} as Record<CellKey, boolean>)

  // Načtení dat z API + overrides
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
        const pv: Record<CellKey, number | ''> = {} as Record<CellKey, number | ''>
        const cf: Record<CellKey, boolean> = {} as Record<CellKey, boolean>
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

  // Přepnutí účtovat/neúčtovat
  const toggleCharge = (ck: CellKey) => {
    setChargeFlags(prev => {
      const next = { ...prev, [ck]: !prev[ck] }
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
      onDataChange?.(matrix, pivotValues, next)
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

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Položka</th>
            {matrix.months.map(m => (
              <th key={`${m.year}-${m.month}`} className="border p-2 text-center">
                {String(m.month).padStart(2, '0')}/{m.year}
              </th>
            ))}
            <th className="border p-2 text-center">Součet</th>
          </tr>
        </thead>
        <tbody>
          {matrix.data.map(row => {
            // Součet se počítá podle aktuálního pivotValues a chargeFlags
            const sum = matrix.months.reduce((a, m) => {
              const ck = `${m.year}-${m.month}-${row.id}` as CellKey
              if (!chargeFlags[ck]) return a
              const v = pivotValues[ck]
              return a + (typeof v === 'number' ? v : 0)
            }, 0)
            return (
              <tr key={row.id}>
                <td className="border p-2 font-medium">{row.name}</td>
                {matrix.months.map(m => {
                  const ck = `${m.year}-${m.month}-${row.id}` as CellKey
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
                            setPivotValues(prev => ({ ...prev, [ck]: num }))
                          }}
                          onBlur={() => saveCell(ck)}
                          className={`w-16 text-right text-xs border rounded px-1 py-0 ${
                            !enabled ? 'opacity-50' : ''
                          }`}
                          min={0}
                        />
                        <span
                          className={`inline-block w-3 h-3 rounded-full cursor-pointer transition ${
                            enabled ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                          title={enabled ? 'Účtuje se' : 'Neúčtuje se'}
                          onClick={() => toggleCharge(ck)}
                        />
                      </div>
                    </td>
                  )
                })}
                <td className="border p-2 text-right font-semibold">{sum}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
