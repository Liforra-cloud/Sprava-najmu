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
export type CellKey = `${number}-${number}-${string}`

type OverrideEntry = {
  lease_id:     string
  year:         number
  month:        number
  charge_id:    string
  override_val: number | null
  note:         string | null
}

/** Dolní tabulka: Přehled plateb */
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
      .then(data => {
        const pm = data.paymentsMatrix
        setMatrix(pm)

        // init pivot + flags
        const pv: Record<string, number | ''> = {}
        const cf: Record<string, boolean>     = {}

        pm.data.forEach(row =>
          pm.months.forEach(({ year, month }, idx) => {
            const key = `${year}-${month}-${row.id}`
            const base = row.values[idx] ?? 0
            const ov = data.overrides.find(o =>
              o.lease_id  === unitId &&
              o.charge_id === row.id &&
              o.year      === year     &&
              o.month     === month
            )
            pv[key] = ov?.override_val ?? base
            cf[key] = ov != null ? ov.override_val !== null : true
          })
        )

        setPivotValues(pv)
        setChargeFlags(cf)

        onDataChange?.(pm, pv, cf)
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [unitId, from, to, onDataChange])

  if (loading) return <div>Načítám…</div>
  if (error)   return <div className="text-red-600">Chyba: {error}</div>
  if (!matrix) return <div>Vyberte nemovitost, jednotku a období.</div>

  const toggleCharge = (ck: string) => {
    setChargeFlags(oldFlags => {
      const nextFlags = { ...oldFlags, [ck]: !oldFlags[ck] }
      // uložit do DB
      const [y, m, ...rest] = ck.split('-')
      const year  = Number(y)
      const month = Number(m)
      const id    = rest.join('-')
      const val   = nextFlags[ck]
        ? (pivotValues[ck] === '' ? 0 : pivotValues[ck])
        : null

      fetch('/api/statement/new', {
        method: 'PATCH',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ leaseId: unitId, year, month, chargeId: id, overrideVal: val })
      })

      onDataChange?.(matrix, pivotValues, nextFlags)
      return nextFlags
    })
  }

  const saveCell = (year: number, month: number, id: string) => {
    const ck = `${year}-${month}-${id}`
    if (!chargeFlags[ck]) return
    const v = pivotValues[ck]
    const val = v === '' ? 0 : v
    fetch('/api/statement/new', {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ leaseId: unitId, year, month, chargeId: id, overrideVal: val })
    })
  }

  return (
    <div className="max-w-4xl mx-auto mt-4">
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-1">Měsíc/Rok</th>
            {matrix.data.map(r => (
              <th key={r.id} className="border p-1 text-center">{r.name}</th>
            ))}
            <th className="border p-1">Poznámka</th>
          </tr>
        </thead>
        <tbody>
          {matrix.months.map(({ year, month }) => {
            const mk = `${year}-${month}`
            return (
              <tr key={mk}>
                <td className="border p-1">{`${String(month).padStart(2,'0')}/${year}`}</td>
                {matrix.data.map(r => {
                  const ck = `${year}-${month}-${r.id}`
                  const on = chargeFlags[ck]
                  return (
                    <td key={ck} className="border p-1">
                      <div className="flex flex-col items-center space-y-1">
                        <span
                          onClick={() => toggleCharge(ck)}
                          style={{ cursor:'pointer', width:12, height:12 }}
                          title={on ? 'Účtovat: ano' : 'Účtovat: ne'}
                        >
                          <svg width="12" height="12" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3"
                              fill={on ? '#22c55e' : '#94a3b8'} />
                          </svg>
                        </span>
                        <input
                          type="number"
                          value={pivotValues[ck]}
                          disabled={!on}
                          onChange={e => {
                            const v = e.target.value
                            const num: number | '' = v === '' ? '' : Number(v)
                            setPivotValues(old => {
                              const next = { ...old, [ck]: num }
                              if (on) onDataChange?.(matrix, next, chargeFlags)
                              return next
                            })
                            if (on) saveCell(year, month, r.id)
                          }}
                          onBlur={() => saveCell(year, month, r.id)}
                          className={`w-full text-center text-xs ${!on?'opacity-50':''}`}
                          min={0}
                        />
                      </div>
                    </td>
                  )
                })}
                <td className="border p-1">
                  {/* poznámky k měsíci */}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
