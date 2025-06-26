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

type OverrideEntry = {
  lease_id:     string
  year:         number
  month:        number
  charge_id:    string
  override_val: number | null
  note:         string | null
}

function ChargedIcon({
  on,
  toggle
}: {
  on: boolean
  toggle(): void
}) {
  return (
    <span
      onClick={toggle}
      style={{ cursor: 'pointer', display: 'inline-block', width: 12, height: 12 }}
      title={on ? 'Účtovat: ano' : 'Účtovat: ne'}
    >
      <svg width="12" height="12" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="3" fill={on ? '#22c55e' : '#94a3b8'} />
      </svg>
    </span>
  )
}

export default function StatementTable({
  unitId,
  from,
  to,
  staticData = false,
  onDataChange
}: {
  unitId: string
  from:   string
  to:     string
  /** Pokud true, data FETCHujeme jen jednou při mountu */
  staticData?: boolean
  onDataChange?: (m: PaymentsMatrix, pv: Record<CellKey, number | ''>) => void
}) {
  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({})
  const [chargeFlags, setChargeFlags] = useState<Record<CellKey, boolean>>({})

  useEffect(() => {
    if (!unitId || staticData) return
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

        const pv: Record<CellKey, number | ''> = {}
        const cf: Record<CellKey, boolean>     = {}
        pm.data.forEach(row =>
          pm.months.forEach(({ year, month }, idx) => {
            const ck   = `${year}-${month}-${row.id}` as CellKey
            const base = row.values[idx] ?? 0
            const ov   = data.overrides.find(o =>
              o.lease_id  === unitId &&
              o.charge_id === row.id &&
              o.year      === year &&
              o.month     === month
            )
            pv[ck] = ov?.override_val ?? base
            cf[ck] = ov != null
              ? ov.override_val !== null
              : true
          })
        )
        setPivotValues(pv)
        setChargeFlags(cf)

        onDataChange?.(pm, pv)
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [unitId, from, to, staticData, onDataChange])

  if (!matrix) {
    if (loading) return <div>Načítám…</div>
    if (error)   return <div className="text-red-600">Chyba: {error}</div>
    return <div>Vyberte jednotku a klikněte na „Vytvořit vyúčtování“</div>
  }

  /** Přepne „účtovat/neúčtovat“ a hned PATCHne změnu */
  const toggleCharge = (ck: CellKey) => {
    setChargeFlags(cf => {
      const next = !cf[ck]
      // hned persistovat
      const [y, m, ...rest] = ck.split('-')
      const year  = Number(y)
      const month = Number(m)
      const id    = rest.join('-')
      const val   = next
        ? (pivotValues[ck] === '' ? 0 : pivotValues[ck])
        : null

      fetch('/api/statement/new', {
        method: 'PATCH',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          leaseId: unitId,
          year, month,
          chargeId: id,
          overrideVal: val
        })
      })

      return { ...cf, [ck]: next }
    })
  }

  /** Uloží změnu hodnoty (pokud checkbox je ON) */
  const saveCell = async (year: number, month: number, id: string) => {
    const ck  = `${year}-${month}-${id}` as CellKey
    if (!chargeFlags[ck]) return
    const v = pivotValues[ck]
    const val = v === '' ? 0 : v
    await fetch('/api/statement/new', {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json' },
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
          {matrix.months.map(({ year, month }) => {
            const mk = `${year}-${month}` as CellKey
            return (
              <tr key={mk}>
                <td className="border p-1">
                  {`${String(month).padStart(2,'0')}/${year}`}
                </td>
                {matrix.data.map(r => {
                  const ck = `${year}-${month}-${r.id}` as CellKey
                  const isOn = chargeFlags[ck]
                  return (
                    <td key={ck} className="border p-1">
                      <div className="flex flex-col items-center space-y-1">
                        <ChargedIcon on={isOn} toggle={() => toggleCharge(ck)} />
                        <input
                          type="number"
                          value={pivotValues[ck]}
                          disabled={!isOn}
                          onChange={e => {
                            const v = e.target.value
                            const num = v === '' ? '' : Number(v)
                            setPivotValues(pv => ({ ...pv, [ck]: num }))
                          }}
                          onBlur={() => saveCell(year, month, r.id)}
                          className={`w-full text-center text-xs ${!isOn ? 'opacity-50' : ''}`}
                          min={0}
                        />
                      </div>
                    </td>
                  )
                })}
                <td className="border p-1">
                  {/* Poznámky k měsíci, pokud chcete */}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
