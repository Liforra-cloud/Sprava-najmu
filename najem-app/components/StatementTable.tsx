// components/StatementTable.tsx

'use client'
import { useEffect, useState } from 'react'

export type Override = {
  leaseId:    string
  year:       number
  month:      number
  chargeId:   string
  overrideVal?: number
  note?:      string
}

type MatrixRow = {
  id: string
  name: string
  values: (number|'')[]
  total: number
}
type PaymentsMatrix = {
  months: { year:number; month:number }[]
  data: MatrixRow[]
}

type CellKey  = `${number}-${number}-${string}`  // "2025-03-rent"
type MonthKey = `${number}-${number}`            // "2025-03"

export type StatementItem = {
  id: string
  name: string
  totalAdvance: number
  consumption: number|''
  unit: string
  totalCost: number|''
  diff: number
  chargeableMonths: number[]
  manual?: boolean
}

const PREDEFINED_ITEMS = [
  { id:'rent',         name:'Nájem',      unit:'Kč' },
  { id:'electricity',  name:'Elektřina',  unit:'kWh' },
  { id:'water',        name:'Voda',       unit:'m³' },
  { id:'gas',          name:'Plyn',       unit:'m³' },
  { id:'services',     name:'Služby',     unit:'Kč' },
  { id:'repair_fund',  name:'Fond oprav', unit:'Kč' },
]

interface Props {
  unitId: string
  from:   string  // "YYYY-MM"
  to:     string  // "YYYY-MM"
}

export default function StatementTable({ unitId, from, to }:Props) {
  const [matrix,      setMatrix]      = useState<PaymentsMatrix|null>(null)
  const [overrides,   setOverrides]   = useState<Override[]>([])
  const [months,      setMonths]      = useState<PaymentsMatrix['months']>([])
  const [items,       setItems]       = useState<StatementItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number|''>>({})
  const [monthNotes,  setMonthNotes]  = useState<Record<MonthKey,string>>({})

  useEffect(()=>{
    if (!unitId) { setLoading(false); return }
    setLoading(true)
    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(r=>r.json())
      .then(({ paymentsMatrix, overrides }: {paymentsMatrix:PaymentsMatrix;overrides:Override[]})=>{
        setMatrix(paymentsMatrix)
        setOverrides(overrides)
        setMonths(paymentsMatrix.months)

        // horní tabulka: jen agregované položky
        const all:StatementItem[] = paymentsMatrix.data.map(r=>{
          const unit = PREDEFINED_ITEMS.find(p=>p.id===r.id)?.unit ?? 'Kč'
          const chargeable = r.values.map((v,i)=> typeof v==='number'? i+1: null)
                                   .filter((m):m is number=> m!==null)
          return {
            id: r.id,
            name: r.name,
            totalAdvance: r.total,
            consumption: '',
            unit,
            totalCost: '',
            diff: 0,
            chargeableMonths: chargeable,
            manual: false
          }
        })
        setItems(all.filter(i=>i.chargeableMonths.length>0))

        // pivotní hodnoty + overrideVal
        const pv:Record<CellKey,number|''> = {}
        paymentsMatrix.data.forEach(r=>{
          paymentsMatrix.months.forEach(m=>{
            const key = `${m.year}-${m.month}-${r.id}` as CellKey
            const baseIdx = paymentsMatrix.months.findIndex(x=>x.year===m.year&&x.month===m.month)
            const base = r.values[baseIdx]
            const ov = overrides.find(o=>o.leaseId===unitId && o.chargeId===r.id && o.year===m.year&&o.month===m.month)
            pv[key] = ov?.overrideVal ?? base
          })
        })
        setPivotValues(pv)

        // poznámky k měsícům
        const mn:Record<MonthKey,string> = {}
        paymentsMatrix.months.forEach(m=>{
          const key = `${m.year}-${m.month}` as MonthKey
          const ov = overrides.find(o=>o.leaseId===unitId && o.chargeId==='' && o.year===m.year&&o.month===m.month)
          mn[key] = ov?.note ?? ''
        })
        setMonthNotes(mn)
      })
      .catch(console.error)
      .finally(()=>setLoading(false))
  },[unitId,from,to])

  // ukládací handlery
  const onPivotBlur = (year:number,month:number,id:string) => {
    const key = `${year}-${month}-${id}` as CellKey
    const val = pivotValues[key]===''?0:pivotValues[key]
    fetch('/api/statement/new',{ 
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ leaseId:unitId,year,month,chargeId:id,overrideVal:val })
    })
  }
  const onNoteBlur = (year:number,month:number) => {
    const key = `${year}-${month}` as MonthKey
    fetch('/api/statement/new',{ 
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ leaseId:unitId,year,month,chargeId:'',note:monthNotes[key] })
    })
  }

  if (loading) return <div>Načítám…</div>
  if (!matrix) return <div>Chyba načtení</div>

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold">Vyúčtování za období</h1>
      {/* Horní tabulka */}
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Název</th>
            <th className="p-2 border">Zálohy</th>
            <th className="p-2 border">Spotřeba</th>
            <th className="p-2 border">Jednotka</th>
            <th className="p-2 border">Náklady</th>
            <th className="p-2 border">Δ</th>
            <th className="p-2 border">Měsíců</th>
          </tr>
        </thead>
        <tbody>
          {items.length===0
            ? <tr><td colSpan={7} className="text-center py-2 text-gray-500">Žádné položky</td></tr>
            : items.map(it=>(
              <tr key={it.id}>
                <td className="border p-1">{it.name}</td>
                <td className="border p-1">{it.totalAdvance}</td>
                <td className="border p-1">{it.consumption}</td>
                <td className="border p-1">{it.unit}</td>
                <td className="border p-1">{it.totalCost}</td>
                <td className="border text-center">
                  <span className={
                    it.diff>0?'text-green-700 font-bold':
                    it.diff<0?'text-red-700 font-bold':''
                  }>
                    {it.diff>0?'+':''}{it.diff}
                  </span>
                </td>
                <td className="border text-center">
                  {it.chargeableMonths.length} / {months.length}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>

      {/* Dolní tabulka */}
      <h2 className="font-semibold mt-6 mb-2">Rozpis nákladů po měsících</h2>
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Měsíc/Rok</th>
            {matrix.data.map(r=>(
              <th key={r.id} className="p-2 border text-center">{r.name}</th>
            ))}
            <th className="p-2 border">Poznámka</th>
          </tr>
        </thead>
        <tbody>
          {months.map(m=>{
            const mk = `${m.year}-${m.month}` as MonthKey
            return (
              <tr key={mk}>
                <td className="border p-1">{`${String(m.month).padStart(2,'0')}/${m.year}`}</td>
                {matrix.data.map(r=>{
                  const ck = `${m.year}-${m.month}-${r.id}` as CellKey
                  return (
                    <td key={ck} className="border p-1">
                      <input
                        type="number"
                        className="w-full text-center"
                        min={0}
                        value={pivotValues[ck]}
                        onChange={e=>{
                          const v = e.target.value
                          const num = v===''? '': Number(v)
                          setPivotValues(pv=>({...pv,[ck]: num}))
                        }}
                        onBlur={()=>onPivotBlur(m.year,m.month,r.id)}
                      />
                    </td>
                  )
                })}
                <td className="border p-1">
                  <textarea
                    className="w-full border rounded px-1 py-1"
                    rows={2}
                    value={monthNotes[mk]}
                    onChange={e=>setMonthNotes(mn=>({...mn,[mk]: e.target.value}))}
                    onBlur={()=>onNoteBlur(m.year,m.month)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
