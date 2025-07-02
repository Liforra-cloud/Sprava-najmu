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
  data:   MatrixRow[]
}

// Klíč buňky ve tvaru "YYYY-M-ID"
export type CellKey = `${number}-${number}-${string}`

type OverrideEntry = {
  lease_id:     string
  year:         number
  month:        number
  charge_id:    string
  override_val: number | null
  note:         string | null
}

export default function StatementTable({
  unitId,
  from,
  to,
  onDataChange
}: {
  unitId: string
  from:   string
  to:     string
  onDataChange?: (
    matrix: PaymentsMatrix,
    pivotValues: Record<string, number | ''>,
    chargeFlags: Record<string, boolean>
  ) => void
}) {
  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<string, number | ''>>({})
  const [chargeFlags, setChargeFlags] = useState<Record<string, boolean>>({})

  // Načtení dat z API + override
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
      .then(data => {
        const pm = data.paymentsMatrix
        setMatrix(pm)

        // Inicializace pivotValues a chargeFlags
        const pv: Record<string, number | ''> = {}
        const cf: Record<string, boolean>     = {}
        pm.data.forEach(row => {
          pm.months.forEach(({ year, month }, idx) => {
            const ck = `${year}-${month}-${row.id}` as CellKey
            const base = row.values[idx] ?? 0
            const ovEntry = data.overrides.find(o =>
              o.lease_id === unitId &&
              o.charge_id === row.id &&
              o.year === year &&
              o.month === month
            )
            pv[ck] = ovEntry?.override_val ?? base
            cf[ck] = ovEntry != null ? ovEntry.override_val !== null : true
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

  // Přidání vlastního sloupce
  const addColumn = () => {
    const name = window.prompt('Název nového poplatku:')
    if (!name) return
    const id = name.trim().replace(/\s+/g, '_')
    if (matrix.data.find(r => r.id === id)) {
      alert('Tento poplatek už existuje.')
      return
    }
    const newRow: MatrixRow = { id, name, values: matrix.months.map(() => 0), total: 0 }
    const newMatrix = { ...matrix, data: [...matrix.data, newRow] }
    setMatrix(newMatrix)
    // inicializace nové buňky
    matrix.months.forEach(({ year, month }) => {
      const ck = `${year}-${month}-${id}` as CellKey
      setPivotValues(pv => ({ ...pv, [ck]: 0 }))
      setChargeFlags(cf => ({ ...cf, [ck]: true }))
    })
    onDataChange?.(newMatrix, pivotValues, chargeFlags)
  }

  // Odebrání sloupce
  const removeColumn = (id: string) => {
    if (!window.confirm(`Opravdu smazat sloupec "${id}"?`)) return
    const newMatrix = { ...matrix, data: matrix.data.filter(r => r.id !== id) }
    setMatrix(newMatrix)
    setPivotValues(pv => {
      const next = { ...pv }
      Object.keys(next).forEach(k => { if (k.endsWith(`-${id}`)) delete next[k] })
      return next
    })
    setChargeFlags(cf => {
      const next = { ...cf }
      Object.keys(next).forEach(k => { if (k.endsWith(`-${id}`)) delete next[k] })
      return next
    })
    onDataChange?.(newMatrix, pivotValues, chargeFlags)
  }

  // Přepnutí účtovat/neúčtovat pro buňku
  const toggleCharge = (ck: CellKey) => {
    setChargeFlags(old => {
      const next = { ...old, [ck]: !old[ck] }
      // odeslání override
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

  // Uložení upravené hodnoty buňky
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
    <div className="overflow-x-auto">
      <button onClick={addColumn} className="mb-2 px-2 py-1 bg-blue-600 text-white rounded">
        Přidat sloupec
      </button>
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Měsíc/Rok</th>
            {matrix.data.map(r => (
              <th key={r.id} className="border p-2 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <span>{r.name}</span>
                  <button onClick={() => removeColumn(r.id)} className="text-red-500 hover:text-red-700" title="Odebrat sloupec" style={{ lineHeight: 1 }}>
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
              <td className="border p-2">{`${String(month).padStart(2,'0')}/${year}`}</td>
              {matrix.data.map(row => {
                const ck = `${year}-${month}-${row.id}` as CellKey
                const enabled = chargeFlags[ck]
                const val = pivotValues[ck]
                return (
                  <td key={ck} className="border p-2 flex items-center space-x-2">
                    {/* Puntík indikující účtovatelnost */}
                    <span
                      className={`inline-block w-3 h-3 rounded-full cursor-pointer ${enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                      title={enabled ? 'Účtovat' : 'Neúčtovat'}
                      onClick={() => toggleCharge(ck)}
                    />
                    {/* Input pro úpravu hodnoty */}
                    <input
                      type="number"
                      value={val}
                      disabled={!enabled}
                      onChange={e => {
                        const num = e.target.value === '' ? '' : Number(e.target.value)
                        setPivotValues(prev => ({ ...prev, [ck]: num }))
                      }}
                      onBlur={() => saveCell(ck)}
                      className="w-16 text-right text-xs border rounded px-1 py-0.5"
                      min={0}
                    />
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
