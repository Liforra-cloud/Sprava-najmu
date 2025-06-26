// app/statement/new/page.tsx

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StatementTable, { PaymentsMatrix, CellKey } from '@/components/Statement/StatementTable'

export default function NewStatementPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // předvyplnit unitId z URL parametru ?unit_id=...
  const paramUnitId  = searchParams.get('unit_id') ?? ''
  const [unitId, setUnitId] = useState(paramUnitId)
  const [title,  setTitle]   = useState('')
  const [from,   setFrom]    = useState(`${new Date().getFullYear()}-01`)
  const [to,     setTo]      = useState(`${new Date().getFullYear()}-12`)
  const [units,  setUnits]   = useState<{ id:string; identifier:string }[]>([])

  const [matrix, setMatrix]  = useState<PaymentsMatrix | null>(null)
  const [pivot,  setPivot]   = useState<Record<CellKey, number | ''>>({})
  const [actuals, setActuals] = useState<Record<string, number | ''>>({})

  useEffect(() => {
    fetch('/api/units')
      .then(r => r.json())
      .then(setUnits)
      .catch(console.error)
  }, [])

  const handleSave = async () => {
    if (!unitId) return alert('Vyberte jednotku')
    if (!title.trim()) return alert('Zadejte název vyúčtování')
    if (!matrix) return alert('Nejsou data načtena')

    const summary: Record<string, { total:number; actual:number; difference:number }> = {}
    matrix.data.forEach(r => {
      const total = matrix.months.reduce((s, m) => {
        const key = `${m.year}-${m.month}-${r.id}` as CellKey
        const v   = pivot[key]
        return s + (typeof v === 'number' ? v : 0)
      }, 0)
      const act = typeof actuals[r.id] === 'number' ? actuals[r.id] as number : 0
      summary[r.id] = { total, actual: act, difference: act - total }
    })

    const res = await fetch('/api/statements/new', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ unitId, title, from, to, annualSummary: summary })
    })
    const js = await res.json()
    if (!res.ok) return alert('Chyba: ' + js.error)
    router.push(`/statements/${js.id}`)
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-6">
      <h1 className="text-2xl font-bold mb-4">Nové vyúčtování</h1>

      <div className="space-y-4">
        <label className="block">
          <span>Název vyúčtování:</span>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="border rounded w-full px-2 py-1"
            placeholder="Např. Vyúčtování 2025"
          />
        </label>
        <label className="block">
          <span>Jednotka:</span>
          <select
            value={unitId}
            onChange={e => setUnitId(e.target.value)}
            className="border rounded w-full px-2 py-1"
          >
            <option value="">-- Vyber jednotku --</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.identifier}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-4">
          <label>
            Období od:
            <input
              type="month"
              value={from}
              max={to}
              onChange={e => setFrom(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </label>
          <label>
            do:
            <input
              type="month"
              value={to}
              min={from}
              onChange={e => setTo(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </label>
        </div>
      </div>

      <StatementTable
        unitId={unitId}
        from={from}
        to={to}
        onDataChange={(m, pv) => { setMatrix(m); setPivot(pv) }}
      />

      <div className="flex gap-4 pt-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 text-white rounded shadow"
        >
          Uložit vyúčtování
        </button>
      </div>
    </div>
  )
}


