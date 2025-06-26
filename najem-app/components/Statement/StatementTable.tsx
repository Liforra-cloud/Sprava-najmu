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
export type CellKey  = `${number}-${number}-${string}`
export type MonthKey = `${number}-${number}`

// Přesný typ override záznamu
type Override = {
  lease_id:    string
  year:        number
  month:       number
  charge_id:   string
  override_val: number | null
  note:        string | null
}

// Ikonka „účtovat/neúčtovat“
function ChargedIcon({ on, toggle }: { on: boolean; toggle(): void }) {
  return (
    <span
      onClick={toggle}
      style={{ cursor: 'pointer', display: 'inline-block', width: 12, height: 12 }}
      title={on ? 'Účtovat: ano' : 'Účtovat: ne'}
    >
      <svg width="12" height="12" viewBox="0 0 8 8">
        <circle
          cx="4" cy="4" r="3"
          fill={on ? '#22c55e' : '#94a3b8'}
        />
      </svg>
    </span>
  )
}

export default function StatementTable({
  unitId, from, to, onDataChange
}: {
  unitId: string
  from:   string
  to:     string
  onDataChange?: (m: PaymentsMatrix, pv: Record<CellKey, number | ''>) => void
}) {
  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
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
      .then(r => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json() as Promise<{ paymentsMatrix: PaymentsMatrix; overrides: Override[] }>
      })
      .then(data => {
        const pm = data.paymentsMatrix
        setMatrix(pm)

        const pv: Record<CellKey, number | ''> = {}
        const cf: Record<CellKey, boolean>     = {}
        pm.data.forEach(row =>
          pm.months.forEach(({ year, month }, idx) => {
            const ck   = `${year}-${month}-${row.id}` as CellKey
            const base = row.values[idx] ?? 0
            const ov   = data.overrides.find(o =>
              o.lease_id === unitId &&
              o.charge_id === row.id &&
              o.year === year &&
              o.month === month
            )
            pv[ck] = ov?.override_val ?? base
            cf[ck] = ov != null ? (ov.override_val !== null) : true
          })
        )
        setPivotValues(pv)
        setChargeFlags(cf)

        onDataChange?.(pm, pv)
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [unitId, from, to, onDataChange])

  if (!matrix) {
    if (loading) return <div>Načítám…</div>
    if (error)   return <div className="text-red-600">Chyba: {error}</div>
    return <div>Vyberte jednotku</div>
  }

  const toggleCharge = (ck: CellKey) =>
    setChargeFlags(cf => ({ ...cf, [ck]: !cf[ck] }))

  const saveCell = async (year: number, month: number, id: string) => {
    const ck  = `${year}-${month}-${id}` as CellKey
    const on  = chargeFlags[ck]
    const val = on ? (pivotValues[ck] === '' ? 0 : pivotValues[ck]) : null

    await fetch('/api/statement/new', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leaseId: unitId,
        year, month,
        chargeId: id,
        overrideVal: val
      })
    })
  }

  return (
    <div className="max-w-4xl mx-auto mt-4 p-4 bg-white shadow rounded space-y-4">
      <h2 className="text-lg font-medium">Rozpis nákladů po měsících</h2>
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-1">Měsíc/Rok</th>
            {matrix.data.map(r => (
              <th key={r.id} className="border p-1">{r.name}</th>
            ))}
            <th className="border p-1">Poznámka</th>
          </tr>
        </thead>
        <tbody>
          {matrix.months.map(m => {
            const mk = `${m.year}-${m.month}` as CellKey
            return (
              <tr key={mk}>
                <td className="border p-1">{`${String(m.month).padStart(2,'0')}/${m.year}`}</td>
                {matrix.data.map(r => {
                  const ck = `${m.year}-${m.month}-${r.id}` as CellKey
                  const on = chargeFlags[ck]
                  return (
                    <td key={ck} className="border p-1">
                      <div className="flex flex-col items-center space-y-1">
                        <ChargedIcon on={on} toggle={() => toggleCharge(ck)} />
                        <input
                          type="number"
                          value={pivotValues[ck]}
                          disabled={!on}
                          onChange={e => {
                            const v = e.target.value
                            const num = v === '' ? '' : Number(v)
                            setPivotValues(pv => ({ ...pv, [ck]: num }))
                          }}
                          onBlur={() => saveCell(m.year, m.month, r.id)}
                          className={`w-full text-center text-xs ${!on ? 'opacity-50' : ''}`}
                          min={0}
                        />
                      </div>
                    </td>
                  )
                })}
                <td className="border p-1">
                  {/* tu zůstanou poznámky */}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
