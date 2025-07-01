// app/statements/new/page.tsx

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

type YearMonth = { year: number; month: number }
type StatementRow = {
  id:     string
  name:   string
  values: number[]
  total:  number
}
type PaymentsMatrix = {
  months: YearMonth[]
  data:   StatementRow[]
}
type Tenant = { full_name: string }
type Property = { id: string; name: string }
type Unit     = { id: string; identifier: string }

export default function NewStatementPage() {
  const router = useRouter()

  // Form state
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits]           = useState<Unit[]>([])
  const [propertyId, setPropertyId] = useState('')
  const [unitId, setUnitId]         = useState('')
  const [from,   setFrom]           = useState(`${new Date().getFullYear()}-01`)
  const [to,     setTo]             = useState(`${new Date().getFullYear()}-12`)

  // Fetched data
  const [paymentsMatrix, setPaymentsMatrix] = useState<PaymentsMatrix | null>(null)
  const [tenant, setTenant]                 = useState<Tenant | null>(null)
  const [error, setError]                   = useState<string | null>(null)
  const [actuals, setActuals]               = useState<Record<string, number | ''>>({})

  // Load properties on mount
  useEffect(() => {
    fetch('/api/properties')
      .then(res => res.json())
      .then((data: Property[]) => setProperties(data))
      .catch(err => setError(err.message))
  }, [])

  // Load units when property changes
  useEffect(() => {
    if (!propertyId) {
      setUnits([])
      setUnitId('')
      return
    }
    fetch(`/api/units?propertyId=${propertyId}`)
      .then(res => res.json())
      .then((data: Unit[]) => setUnits(data))
      .catch(err => setError(err.message))
  }, [propertyId])

  // Load paymentsMatrix and tenant when unitId, from, or to changes
  useEffect(() => {
    if (!unitId) return
    setError(null)
    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(async res => {
        if (!res.ok) {
          const payload = await res.json()
          throw new Error(payload.error ?? 'Chyba při načítání vyúčtování')
        }
        return res.json()
      })
      .then((payload: { paymentsMatrix: PaymentsMatrix; tenant: Tenant }) => {
        if (!payload.paymentsMatrix?.data) {
          throw new Error('Neočekávaná struktura odpovědi')
        }
        setPaymentsMatrix(payload.paymentsMatrix)
        setTenant(payload.tenant)
        // reset actuals
        setActuals({})
      })
      .catch(err => setError(err.message))
  }, [unitId, from, to])

  // Summary computation
  const summary = useMemo(() => {
    if (!paymentsMatrix) return []
    return paymentsMatrix.data.map(row => {
      const total = row.total
      const actual = typeof actuals[row.id] === 'number'
        ? (actuals[row.id] as number)
        : 0
      return {
        id:     row.id,
        name:   row.name,
        total,
        actual,
        diff: actual - total
      }
    })
  }, [paymentsMatrix, actuals])

  // Save final statement
  const handleSave = () => {
    if (!unitId || !paymentsMatrix) return
    setError(null)
    fetch('/api/statement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId, from, to, actuals })
    })
      .then(async res => {
        if (!res.ok) {
          const payload = await res.json()
          throw new Error(payload.error ?? 'Chyba při ukládání')
        }
        return res.json()
      })
      .then((data: { id: string }) => {
        router.push(`/statements/${data.id}`)
      })
      .catch(err => setError(err.message))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Vyúčtování</h1>

      {error && <div className="text-red-600">Chyba: {error}</div>}

      {/* Výběr nemovitosti a jednotky */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label>
          Nemovitost:
          <select
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
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
            disabled={!propertyId}
            className="border rounded w-full px-2 py-1"
          >
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
          <input
            type="month"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <label>
          Do:
          <input
            type="month"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
      </div>

      {/* Souhrnné vyúčtování */}
      {paymentsMatrix && (
        <div className="bg-gray-50 p-4 rounded border">
          <h2 className="text-xl font-semibold mb-2">Přehled období</h2>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Poplatek</th>
                <th className="border p-2 text-right">Vypočteno</th>
                <th className="border p-2 text-right">Skutečně</th>
                <th className="border p-2 text-right">Rozdíl</th>
              </tr>
            </thead>
            <tbody>
              {summary.map(r => (
                <tr key={r.id}>
                  <td className="border p-2">{r.name}</td>
                  <td className="border p-2 text-right">{r.total}</td>
                  <td className="border p-2 text-right">
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
                      className="w-20 text-right border rounded px-1 py-0.5"
                      min={0}
                    />
                  </td>
                  <td className={`border p-2 text-right ${r.diff < 0 ? 'text-red-600' : ''}`}>
                    {r.diff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Matice plateb */}
      {paymentsMatrix && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Přehled plateb</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1 text-left">Položka</th>
                {paymentsMatrix.months.map(m => (
                  <th key={`${m.year}-${m.month}`} className="border px-2 py-1">
                    {String(m.month).padStart(2, '0')}/{m.year}
                  </th>
                ))}
                <th className="border px-2 py-1">Součet</th>
              </tr>
            </thead>
            <tbody>
              {paymentsMatrix.data.map(row => (
                <tr key={row.id}>
                  <td className="border px-2 py-1">{row.name}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="border px-2 py-1">{v}</td>
                  ))}
                  <td className="border px-2 py-1 font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Uložit */}
      {paymentsMatrix && (
        <div className="text-right">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Uložit vyúčtování
          </button>
        </div>
      )}
    </div>
  )
}
