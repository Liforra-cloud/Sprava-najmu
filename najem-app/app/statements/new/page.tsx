// app/statements/new/page.tsx

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import StatementTable, { PaymentsMatrix, CellKey } from '@/components/Statement/StatementTable'

export default function NewStatementPage() {
  const [propertyId, setPropertyId] = useState('')
  const [unitId,     setUnitId]     = useState('')
  const [title,      setTitle]      = useState('')
  const [from,       setFrom]       = useState(`${new Date().getFullYear()}-01`)
  const [to,         setTo]         = useState(`${new Date().getFullYear()}-12`)

  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [units,      setUnits]      = useState<{ id: string; identifier: string }[]>([])

  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({})
  const [actuals,     setActuals]     = useState<Record<string, number | ''>>({})
  const [locked,      setLocked]      = useState(false)

  // memoizovaný callback
  const handleDataChange = useCallback(
    (m: PaymentsMatrix, pv: Record<CellKey, number | ''>) => {
      setMatrix(m)
      setPivotValues(pv)
    },
    []
  )

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then(setProperties)
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!propertyId) { setUnits([]); setUnitId(''); return }
    fetch(`/api/units?propertyId=${propertyId}`)
      .then(r => r.json())
      .then(setUnits)
      .catch(console.error)
  }, [propertyId])

  const handleCreate = async () => {
    if (!propertyId || !unitId || !title.trim()) {
      return alert('Vyplňte nemovitost, jednotku a název')
    }
    const res = await fetch('/api/statements/new', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ propertyId, unitId, title, from, to })
    })
    if (!res.ok) {
      const js = await res.json()
      return alert('Chyba: ' + js.error)
    }
    setLocked(true)  // hlavička se uzamkne, tabulka i summary zůstanou
  }

  // Compute přehled období
  const summary = React.useMemo(() => {
    if (!matrix) return []
    return matrix.data.map(row => {
      const total = matrix.months.reduce((s, m) => {
        const key = `${m.year}-${m.month}-${row.id}` as CellKey
        const v   = pivotValues[key]
        return s + (typeof v === 'number' ? v : 0)
      }, 0)
      const act  = typeof actuals[row.id] === 'number' ? actuals[row.id] as number : 0
      return {
        id: row.id,
        name: row.name,
        total,
        actual: act,
        diff: act - total
      }
    })
  }, [matrix, pivotValues, actuals])

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-6">

      <h1 className="text-2xl font-bold">Nové vyúčtování</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label>
          Nemovitost:
          <select
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
            disabled={locked}
            className="border rounded w-full px-2 py-1"
          >
            <option value="">-- vyber --</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label>
          Jednotka:
          <select
            value={unitId}
            onChange={e => setUnitId(e.target.value)}
            disabled={locked || !propertyId}
            className="border rounded w-full px-2 py-1"
          >
            <option value="">-- vyber --</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.identifier}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        Název vyúčtování:
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border rounded w-full px-2 py-1"
        />
      </label>

      <div className="flex gap-4">
        <label>
          Období od:
          <input
            type="month"
            value={from}
            onChange={e => setFrom(e.target.value)}
            disabled={locked}
            className="border rounded px-2 py-1"
          />
        </label>
        <label>
          do:
          <input
            type="month"
            value={to}
            onChange={e => setTo(e.target.value)}
            disabled={locked}
            className="border rounded px-2 py-1"
          />
        </label>
      </div>

      <button
        onClick={handleCreate}
        disabled={locked}
        className={`px-4 py-2 rounded ${locked
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
          : 'bg-green-600 text-white'}`}
      >
        {locked ? 'Vyúčtování vytvořeno' : 'Vytvořit vyúčtování'}
      </button>

      {/* Přehled období */}
      {matrix && (
        <div>
          <h2 className="text-xl font-semibold">Přehled období</h2>
          <table className="w-full border text-sm mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Poplatek</th>
                <th className="border p-2 text-right">Vypočteno</th>
                <th className="border p-2 text-right">Reálná spotřeba</th>
                <th className="border p-2 text-right">Rozdíl</th>
              </tr>
            </thead>
            <tbody>
              {summary.map(row => (
                <tr key={row.id}>
                  <td className="border p-1">{row.name}</td>
                  <td className="border p-1 text-right">{row.total}</td>
                  <td className="border p-1 text-right">
                    <input
                      type="number"
                      value={actuals[row.id] ?? ''}
                      onChange={e => {
                        const v = e.target.value
                        const num = v === '' ? '' : Number(v)
                        setActuals(a => ({ ...a, [row.id]: num }))
                      }}
                      className="w-20 text-right text-xs border rounded px-1 py-0.5"
                      min={0}
                    />
                  </td>
                  <td className={`border p-1 text-right ${row.diff < 0 ? 'text-red-600' : ''}`}>
                    {row.diff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabulka nákladů */}
      {unitId && (
        <StatementTable
          unitId={unitId}
          from={from}
          to={to}
          staticData={locked}
          onDataChange={handleDataChange}
        />
      )}
    </div>
  )
}
