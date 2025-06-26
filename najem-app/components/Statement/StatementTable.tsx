// components/Statement/StatementTable.tsx
'use client'

import React, { useEffect, useState } from 'react'

function makeSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

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
type Override = {
  lease_id:    string
  year:        number
  month:       number
  charge_id:   string
  override_val: number | null
  note:        string | null
}
export type CellKey  = `${number}-${number}-${string}`
export type MonthKey = `${number}-${number}`

interface Props {
  unitId:       string
  from:         string
  to:           string
  onDataChange?: (m: PaymentsMatrix, pv: Record<CellKey, number | ''>) => void
}

export default function StatementTable({
  unitId, from, to, onDataChange
}: Props) {
  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({})
  const [monthNotes,  setMonthNotes]  = useState<Record<MonthKey, string>>({})

  useEffect(() => {
    if (!unitId) { setMatrix(null); return }
    setLoading(true); setError(null)

    ;(async () => {
      try {
        const res = await fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
        if (!res.ok) throw new Error(`(${res.status}) ${res.statusText}`)
        const data: { paymentsMatrix: PaymentsMatrix; overrides: Override[] } = await res.json()

        const pm = data.paymentsMatrix
        setMatrix(pm)

        const pv: Record<CellKey, number | ''> = {}
        pm.data.forEach(row =>
          pm.months.forEach(({ year, month }, idx) => {
            const ck = `${year}-${month}-${row.id}` as CellKey
            const base = row.values[idx] ?? 0
            const ov = data.overrides.find(o =>
              o.lease_id  === unitId &&
              o.charge_id === row.id &&
              o.year      === year &&
              o.month     === month
            )
            pv[ck] = ov?.override_val ?? base
          })
        )
        setPivotValues(pv)

        const mn: Record<MonthKey, string> = {}
        pm.months.forEach(({ year, month }) => {
          const mk = `${year}-${month}` as MonthKey
          const ov = data.overrides.find(o =>
            o.lease_id  === unitId &&
            o.charge_id === '' &&
            o.year      === year &&
            o.month     === month
          )
          mn[mk] = ov?.note ?? ''
        })
        setMonthNotes(mn)

        onDataChange?.(pm, pv)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [unitId, from, to])

  useEffect(() => {
    if (matrix) onDataChange?.(matrix, pivotValues)
  }, [matrix, pivotValues])

  if (loading) return <div>Načítám…</div>
  if (error)   return <div className="text-red-600">Chyba: {error}</div>
  if (!matrix) return <div>Chyba načtení dat</div>

  const saveCell = async (year:number, month:number, id:string) => {
    const ck  = `${year}-${month}-${id}` as CellKey
    const val = pivotValues[ck]===''?0:pivotValues[ck]
    try {
      const res = await fetch('/api/statement/new', {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ leaseId: unitId, year, month, chargeId: id, overrideVal: val })
      })
      if (!res.ok) throw new Error(`(${res.status}) ${res.statusText}`)
    } catch(e) {
      console.error('Chyba při ukládání:', e)
    }
  }

  const saveNote = async (year:number, month:number) => {
    const mk = `${year}-${month}` as MonthKey
    try {
      const res = await fetch('/api/statement/new', {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ leaseId: unitId, year, month, chargeId: '', note: monthNotes[mk] })
      })
      if (!res.ok) throw new Error(`(${res.status}) ${res.statusText}`)
    } catch(e) {
      console.error('Chyba při ukládání poznámky:', e)
    }
  }

  const handleAddColumn = () => {
    const name = prompt('Název nového poplatku:')
    if (!name) return
    const id = makeSlug(name)
    const newRow: MatrixRow = { id, name, values: matrix.months.map(()=>''), total:0 }
    setMatrix(m => m ? { ...m, data:[...m.data,newRow] } : m)
    const newPv = { ...pivotValues }
    matrix.months.forEach(({year,month})=>{
      newPv[`${year}-${month}-${id}` as CellKey]=''
    })
    setPivotValues(newPv)
  }

  const handleRemoveColumn = (colId:string) => {
    if (!confirm('Opravdu odstranit sloupec?')) return
    setMatrix(m=>m?{...m,data:m.data.filter(r=>r.id!==colId)}:m)
    const newPv={...pivotValues}
    matrix.months.forEach(({year,month})=>{
      delete newPv[`${year}-${month}-${colId}` as CellKey]
    })
    setPivotValues(newPv)
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Rozpis nákladů po měsících</h2>
        <button
          onClick={handleAddColumn}
          className="px-3 py-1 bg-blue-600 text-white rounded
