// app/statements/new/page.tsx
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StatementTable, { PaymentsMatrix, CellKey } from '@/components/Statement/StatementTable'

export default function NewStatementPage() {
  const [propertyId, setPropertyId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01`)
  const [to,   setTo]   = useState(`${new Date().getFullYear()}-12`)

  const [properties, setProperties] = useState<{id:string; name:string}[]>([])
  const [units, setUnits] = useState<{id:string; identifier:string}[]>([])

  const [matrix, setMatrix] = useState<PaymentsMatrix|null>(null)
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({})
  const [chargeFlags, setChargeFlags] = useState<Record<CellKey, boolean>>({})
  const [actuals, setActuals] = useState<Record<string, number | ''>>({})

  const router = useRouter()

  // Callback při změně dat v tabulce
  const handleDataChange = useCallback((
    m: PaymentsMatrix,
    pv: Record<CellKey, number | ''>,
    cf: Record<CellKey, boolean>
  ) => {
    setMatrix(m)
    setPivotValues(pv)
    setChargeFlags(cf)
  }, [])

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then(setProperties)
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!propertyId) {
      setUnits([])
      setUnitId('')
      return
    }
    fetch(`/api/units?propertyId=${propertyId}`)
      .then(r => r.json())
      .then(setUnits)
      .catch(console.error)
  }, [propertyId])

  // Výpočet souhrnného přehledu položek (jen ty s chargeFlags=true)
  const summary = useMemo(() => {
    if (!matrix) return []
    return matrix.data.map(row => {
      const total = matrix.months.reduce((sum, m) => {
        const key = `${m.year}-${m.month}-${row.id}` as CellKey
        if (!chargeFlags[key]) return sum  // neúčtované položky nepočítat
        const v = pivotValues[key]
        return sum + (typeof v === 'number' ? v : 0)
      }, 0)
      const act = typeof actuals[row.id] === 'number' ? (actuals[row.id] as number) : 0
      return { id: row.id, name: row.name, total, actual: act, diff: act - total }
    })
  }, [matrix, pivotValues, chargeFlags, actuals])

  // Funkce pro uložení vyúčtování
  const handleSave = () => {
    if (!unitId || !matrix) return
    const payload = { unitId, from, to, actuals }
    fetch('/api/statements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(`Chyba při ukládání: ${data.error}`)
      } else {
        // přesměrovat na detail uloženého vyúčtování
        router.push(`/statements/${data.id}`)
      }
    })
    .catch(err => console.error('Save error', err))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Vyúčtování</h1>

      {/* Formulář pro výběr nemovitosti a jednotky */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label>
          Nemovitost:
          <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="border rounded w-full px-2 py-1">
            <option value="">-- vyber --</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label>
          Jednotka:
          <select value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!propertyId} className="border rounded w-full px-2 py-1">
            <option value="">-- vyber --</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.identifier}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Výběr období */}
      <div className="flex gap-4">
        <label>
          Od:
          <input type="month" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-2 py-1" />
        </label>
        <label>
          Do:
          <input type="month" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-2 py-1" />
        </label>
      </div>

      {/* Souhrnné zobrazení za období */}
      {matrix && (
        <div className="bg-gray-50 p-4 rounded border">
          <h2 className="text-xl font-semibold mb-2">Přehled období</h2>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Poplatek</th>
                <th className="border p-2 text-right">Vypočteno</th>
                <th className="border p-2 text-right">Reálná spotřeba</th>
                <th className="border p-2 text-right">Rozdíl</th>
              </tr>
            </thead>
            <tbody>
              {summary.map(r => (
                <tr key={r.id}>
                  <td className="border p-1">{r.name}</td>
                  <td className="border p-1 text-right">{r.total}</td>
                  <td className="border p-1 text-right">
                    <input
                      type="number"
                      value={actuals[r.id] ?? ''}
                      onChange={e => {
                        const val = e.target.value
                        setActuals(prev => ({
                          ...prev,
                          [r.id]: val === '' ? '' : Number(val)
                        }))
                      }}
                      className="w-20 text-right text-xs border rounded px-1 py-0.5"
                      min={0}
                    />
                  </td>
                  <td className={`border p-1 text-right ${r.diff < 0 ? 'text-red-600' : ''}`}>
                    {r.diff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Přehledná tabulka plateb (měsíce x poplatky) */}
      {unitId && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Přehled plateb</h2>
          <StatementTable
            unitId={unitId}
            from={from}
            to={to}
            onDataChange={handleDataChange}
          />
        </div>
      )}

      {/* Tlačítko Uložit */}
      {unitId && matrix && (
        <div className="text-right">
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
            Uložit vyúčtování
          </button>
        </div>
      )}
    </div>
  )
}
