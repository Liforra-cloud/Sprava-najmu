// components/Statement/StatementTable.tsx

'use client'

import React, { useEffect, useState } from 'react'

export type MatrixRow = {
  id:     string
  name:   string
  values: (number | '')[]
}

export type PaymentsMatrix = {
  months: { year: number; month: number }[]
  data:   MatrixRow[]
}

export type CellKey = `${number}-${number}-${string}`

type OverrideEntry = {
  lease_id:     string
  year:         number
  month:        number
  charge_id:    string
  override_val: number | null
  note:         string | null
}

interface StatementTableProps {
  unitId: string
  from:   string
  to:     string
  onDataChange?: (
    matrix:      PaymentsMatrix,
    pivotValues: Record<CellKey, number | ''>,
    chargeFlags: Record<CellKey, boolean>
  ) => void
}

export default function StatementTable({
  unitId,
  from,
  to,
  onDataChange,
}: StatementTableProps) {
  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [loading,     setLoading]     = useState<boolean>(false)
  const [error,       setError]       = useState<string | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>(
    {} as Record<CellKey, number | ''>
  )
  const [chargeFlags, setChargeFlags] = useState<Record<CellKey, boolean>>(
    {} as Record<CellKey, boolean>
  )

  // Load the matrix + overrides
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
        return res.json() as Promise<{
          paymentsMatrix: PaymentsMatrix
          overrides:      OverrideEntry[]
        }>
      })
      .then(({ paymentsMatrix: pm, overrides }) => {
        setMatrix(pm)

        // build fresh pivot+flags maps
        const pv: Record<CellKey, number | ''>   = {} as any
        const cf: Record<CellKey, boolean>       = {} as any

        pm.months.forEach(({ year, month }, mi) => {
          pm.data.forEach(row => {
            const ck   = `${year}-${month}-${row.id}` as CellKey
            const base = row.values[mi] ?? 0
            const ov   = overrides.find(o =>
              o.lease_id  === unitId &&
              o.charge_id === row.id   &&
              o.year      === year     &&
              o.month     === month
            )
            pv[ck] = ov?.override_val ?? base
            cf[ck] = ov ? ov.override_val !== null : true
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
  if (error)   return <div className="text-red-600">Chyba: {error}</div>
  if (!matrix) return <div>Vyberte jednotku a období.</div>

  // Add / remove item (column)
  const addColumn = () => {
    const name = prompt('Název nové položky:')?.trim()
    if (!name) return
    const id = name.replace(/\s+/g, '_')
    if (matrix.data.some(r => r.id === id)) {
      alert('Tato položka již existuje.')
      return
    }
    const newRow: MatrixRow = { id, name, values: matrix.months.map(() => 0) }
    setMatrix(prev => prev && ({ months: prev.months, data: [...prev.data, newRow] }))
    setPivotValues(old => {
      const next = { ...old }
      matrix.months.forEach(({ year, month }) => {
        next[`${year}-${month}-${id}` as CellKey] = 0
      })
      return next
    })
    setChargeFlags(old => {
      const next = { ...old }
      matrix.months.forEach(({ year, month }) => {
        next[`${year}-${month}-${id}` as CellKey] = true
      })
      return next
    })
  }

  const removeColumn = (id: string) => {
    if (!confirm(`Opravdu smazat položku "${id}"?`)) return
    setMatrix(prev => prev && ({
      months: prev.months,
      data:   prev.data.filter(r => r.id !== id)
    }))
    setPivotValues(old => {
      const next = { ...old }
      Object.keys(next).forEach(k => k.endsWith(`-${id}`) && delete next[k as CellKey])
      return next
    })
    setChargeFlags(old => {
      const next = { ...old }
      Object.keys(next).forEach(k => k.endsWith(`-${id}`) && delete next[k as CellKey])
      return next
    })
  }

  // Toggle charge on/off
  const toggleCharge = (ck: CellKey) => {
    setChargeFlags(prev => {
      const next = { ...prev, [ck]: !prev[ck] }
      const [y,m,...rest] = ck.split('-')
      const year     = +y
      const month    = +m
      const chargeId = rest.join('-')
      const val      = next[ck] ? (pivotValues[ck] === '' ? 0 : pivotValues[ck]) : null

      fetch('/api/statement', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ leaseId:unitId, year, month, chargeId, overrideVal: val })
      })

      onDataChange?.(matrix, pivotValues, next)
      return next
    })
  }

  // Save a single cell
  const saveCell = (ck: CellKey) => {
    if (!chargeFlags[ck]) return
    const [y,m,...rest] = ck.split('-')
    const year     = +y
    const month    = +m
    const chargeId = rest.join('-')
    const val      = pivotValues[ck] === '' ? 0 : pivotValues[ck]

    fetch('/api/statement', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ leaseId:unitId, year, month, chargeId, overrideVal: val })
    })
  }

  // Sums
  const getRowSum = (year: number, month: number) =>
    matrix.data.reduce((s, r) => {
      const ck = `${year}-${month}-${r.id}` as CellKey
      const v  = pivotValues[ck]
      return s + (chargeFlags[ck] && typeof v === 'number' ? v : 0)
    }, 0)

  const getColSum = (id: string) =>
    matrix.months.reduce((s, { year, month }) => {
      const ck = `${year}-${month}-${id}` as CellKey
      const v  = pivotValues[ck]
      return s + (chargeFlags[ck] && typeof v === 'number' ? v : 0)
    }, 0)

  return (
    <div className="overflow-x-auto border rounded-lg mt-4">
      <div className="flex justify-end mb-2">
        <button
          onClick={addColumn}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Přidat položku
        </button>
      </div>

      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-center">Měsíc/Rok</th>
            {matrix.data.map(r => (
              <th key={r.id} className="border p-2 text-center">
                <div className="inline-flex items-center space-x-1">
                  <span>{r.name}</span>
                  <button
                    onClick={() => removeColumn(r.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Odebrat položku"
                  >
                    ×
                  </button>
                </div>
              </th>
            ))}
            <th className="border p-2 text-center font-bold">Součet</th>
          </tr>
        </thead>

        <tbody>
          {matrix.months.map(({ year, month }) => (
            <tr key={`${year}-${month}`}>
              <td className="border p-2 text-center">
                {String(month).padStart(2,'0')}/{year}
              </td>
              {matrix.data.map(r => {
                const ck      = `${year}-${month}-${r.id}` as CellKey
                const enabled = chargeFlags[ck]
                const val     = pivotValues[ck]
                return (
                  <td key={ck} className="border p-2 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <input
                        type="number"
                        value={val}
                        disabled={!enabled}
                        min={0}
                        onChange={e =>
                          setPivotValues(prev => ({
                            ...prev,
                            [ck]: e.target.value === '' ? '' : +e.target.value
                          }))
                        }
                        onBlur={() => saveCell(ck)}
                        className={`w-16 text-right text-xs border rounded px-1 py-0 ${
                          !enabled ? 'opacity-50' : ''
                        }`}
                      />
                      <span
                        className={`w-3 h-3 rounded-full cursor-pointer border ${
                          enabled ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        title={enabled ? 'Účtovat' : 'Neúčtovat'}
                        onClick={() => toggleCharge(ck)}
                      />
                    </div>
                  </td>
                )
              })}
              <td className="border p-2 text-right font-bold">
                {getRowSum(year, month)}
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <td className="border p-2 text-center font-bold">Součet</td>
            {matrix.data.map(r => (
              <td key={r.id} className="border p-2 text-right font-bold">
                {getColSum(r.id)}
              </td>
            ))}
            <td className="border p-2" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
