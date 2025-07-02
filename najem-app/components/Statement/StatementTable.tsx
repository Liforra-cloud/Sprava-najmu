// components/Statement/StatementTable.tsx
'use client'

import React, { useEffect, useState } from 'react'

// Klíč buňky: "YYYY-M-<id položky>"
export type CellKey = `${number}-${number}-${string}`

// Jedna řada v matici plateb (jedna položka napříč všemi měsíci)
export interface MatrixRow {
  id:     string
  name:   string
  values: (number | '')[]
}

// Data matice plateb: seznam měsíců a seznam položek
export interface PaymentsMatrix {
  months: { year: number; month: number }[]
  data:   MatrixRow[]
}

// Záznam přepisu z API
interface OverrideEntry {
  lease_id:     string
  year:         number
  month:        number
  charge_id:    string
  override_val: number | null
  note:         string | null
}

interface StatementTableProps {
  unitId:       string
  from:         string     // yyyy-MM
  to:           string     // yyyy-MM
  onDataChange?: (
    matrix: PaymentsMatrix,
    pivotValues: Record<CellKey, number | ''>,
    chargeFlags: Record<CellKey, boolean>
  ) => void
}

export default function StatementTable({
  unitId, from, to, onDataChange
}: StatementTableProps) {
  const [matrix,       setMatrix]       = useState<PaymentsMatrix | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [pivotValues,  setPivotValues]  = useState<Record<CellKey, number | ''>>({})
  const [chargeFlags,  setChargeFlags]  = useState<Record<CellKey, boolean>>({})

  // — Načtení matice a přepisů z API —
  useEffect(() => {
    if (!unitId) { setMatrix(null); return }
    setLoading(true); setError(null)

    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<{ paymentsMatrix: PaymentsMatrix; overrides: OverrideEntry[] }>
      })
      .then(({ paymentsMatrix, overrides }) => {
        setMatrix(paymentsMatrix)

        // Inicializace pivotValues i chargeFlags
        const pv: Record<CellKey, number | ''> = {}
        const cf: Record<CellKey, boolean>     = {}

        paymentsMatrix.months.forEach(({ year, month }, mi) => {
          paymentsMatrix.data.forEach(row => {
            const key = `${year}-${month}-${row.id}` as CellKey
            const base = row.values[mi] ?? 0
            const ov = overrides.find(o =>
              o.lease_id === unitId &&
              o.year     === year   &&
              o.month    === month  &&
              o.charge_id=== row.id
            )
            pv[key] = ov?.override_val ?? base
            cf[key] = ov ? (ov.override_val !== null) : true
          })
        })

        setPivotValues(pv)
        setChargeFlags(cf)
        onDataChange?.(paymentsMatrix, pv, cf)
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [unitId, from, to, onDataChange])

  if (loading)   return <div>Načítám…</div>
  if (error)     return <div className="text-red-600">Chyba: {error}</div>
  if (!matrix)   return <div>Vyberte jednotku a období.</div>

  // — Přidat novou položku (sloupec) —
  const addColumn = () => {
    const name = prompt('Název nové položky:')?.trim()
    if (!name) return
    const id = name.replace(/\s+/g,'_')
    if (matrix.data.some(r => r.id === id)) {
      alert('Položka s tímto ID již existuje.')
      return
    }
    const newRow: MatrixRow = { id, name, values: matrix.months.map(() => 0) }
    const newMatrix: PaymentsMatrix = {
      months: matrix.months,
      data:   [...matrix.data, newRow]
    }
    setMatrix(newMatrix)

    // Rozšířit pivotValues
    setPivotValues(prev => {
      const next = { ...prev }
      matrix.months.forEach(({year,month}) => {
        next[`${year}-${month}-${id}` as CellKey] = 0
      })
      return next
    })
    // Rozšířit chargeFlags
    setChargeFlags(prev => {
      const next = { ...prev }
      matrix.months.forEach(({year,month}) => {
        next[`${year}-${month}-${id}` as CellKey] = true
      })
      return next
    })

    onDataChange?.(newMatrix, pivotValues, chargeFlags)
  }

  // — Odebrat položku (sloupec) —
  const removeColumn = (id: string) => {
    if (!confirm(`Opravdu smažu položku "${id}"?`)) return
    const newMatrix: PaymentsMatrix = {
      months: matrix.months,
      data:   matrix.data.filter(r => r.id !== id)
    }
    setMatrix(newMatrix)
    setPivotValues(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => {
        if (k.endsWith(`-${id}`)) delete next[k as CellKey]
      })
      return next
    })
    setChargeFlags(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => {
        if (k.endsWith(`-${id}`)) delete next[k as CellKey]
      })
      return next
    })
    onDataChange?.(newMatrix, pivotValues, chargeFlags)
  }

  // — Uložit změnu jedné buňky —
  const saveCell = (key: CellKey) => {
    if (!chargeFlags[key]) return
    const [y, m, ...rest] = key.split('-')
    const year     = +y
    const month    = +m
    const chargeId = rest.join('-')
    const overrideVal = pivotValues[key] === '' ? 0 : pivotValues[key]
    fetch('/api/statement/new', {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ leaseId: unitId, year, month, chargeId, overrideVal })
    }).catch(console.error)
  }

  // — Přepnout účtovat / neúčtovat —
  const toggleCharge = (key: CellKey) => {
    setChargeFlags(prev => {
      const next = { ...prev, [key]: !prev[key] }
      // okamžitě uložit na server
      saveCell(key)
      onDataChange?.(matrix, pivotValues, next)
      return next
    })
  }

  // Součet hodnot za řádek (měsíc)
  const getRowSum = (year: number, month: number) =>
    matrix.data.reduce((sum, row) => {
      const key = `${year}-${month}-${row.id}` as CellKey
      const val = pivotValues[key]
      return sum + (chargeFlags[key] && typeof val === 'number' ? val : 0)
    }, 0)

  // Součet hodnot za sloupec (položku)
  const getColumnSum = (id: string) =>
    matrix.months.reduce((sum, {year,month}) => {
      const key = `${year}-${month}-${id}` as CellKey
      const val = pivotValues[key]
      return sum + (chargeFlags[key] && typeof val === 'number' ? val : 0)
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
                <div className="flex items-center justify-center space-x-1">
                  <span>{r.name}</span>
                  <button
                    onClick={() => removeColumn(r.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Smazat položku"
                  >
                    ×
                  </button>
                </div>
              </th>
            ))}
            <th className="border p-2 text-center font-semibold">Součet</th>
          </tr>
        </thead>

        <tbody>
          {matrix.months.map(({year,month}) => (
            <tr key={`${year}-${month}`}>
              <td className="border p-2 text-center">
                {String(month).padStart(2,'0')}/{year}
              </td>
              {matrix.data.map(r => {
                const key     = `${year}-${month}-${r.id}` as CellKey
                const enabled = chargeFlags[key]
                const val     = pivotValues[key]

                return (
                  <td key={key} className="border p-2">
                    <div className="flex items-center justify-end space-x-2">
                      <input
                        type="number"
                        className={`w-16 text-right text-xs border rounded px-1 py-0 ${
                          !enabled ? 'opacity-50' : ''
                        }`}
                        disabled={!enabled}
                        value={val}
                        min={0}
                        onChange={e => {
                          const num = e.target.value === '' ? '' : Number(e.target.value)
                          setPivotValues(prev => ({ ...prev, [key]: num }))
                        }}
                        onBlur={() => saveCell(key)}
                      />
                      <span
                        className={`inline-block w-3 h-3 rounded-full cursor-pointer ${
                          enabled ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        title={enabled ? 'Účtovat' : 'Neúčtovat'}
                        onClick={() => toggleCharge(key)}
                        style={{ border: '1px solid #ccc' }}
                      />
                    </div>
                  </td>
                )
              })}
              <td className="border p-2 text-right font-semibold">
                {getRowSum(year, month)}
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <td className="border p-2 font-semibold">Součet</td>
            {matrix.data.map(r => (
              <td key={r.id} className="border p-2 text-right font-semibold">
                {getColumnSum(r.id)}
              </td>
            ))}
            <td className="border p-2" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
