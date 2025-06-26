// components/Statement/AnnualSummary.tsx
'use client'

import React from 'react'
import { PaymentsMatrix, CellKey } from './StatementTable'

interface AnnualRow {
  id:         string
  name:       string
  total:      number
  actual:     number
  difference: number
}

interface AnnualSummaryProps {
  matrix:       PaymentsMatrix
  pivotValues:  Record<CellKey, number | ''>
  actuals:      Record<string, number>
  onActualChange: (chargeId: string, value: number) => void
}

export default function AnnualSummary({
  matrix,
  pivotValues,
  actuals,
  onActualChange
}: AnnualSummaryProps) {
  // sestav data pro každý poplatek
  const rows: AnnualRow[] = matrix.data.map(r => {
    const total = matrix.months.reduce((sum, m) => {
      const key = `${m.year}-${m.month}-${r.id}` as CellKey
      const v   = pivotValues[key]
      return sum + (typeof v === 'number' ? v : 0)
    }, 0)
    const act = actuals[r.id] ?? 0
    return {
      id: r.id,
      name: r.name,
      total,
      actual:     act,
      difference: act - total
    }
  })

  return (
    <div className="bg-white shadow rounded p-6">
      <h2 className="text-xl font-semibold mb-4">Roční souhrn</h2>
      <table className="w-full table-auto border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1 text-left">Poplatek</th>
            <th className="border px-2 py-1 text-right">Vypočteno</th>
            <th className="border px-2 py-1 text-right">Reálná spotřeba</th>
            <th className="border px-2 py-1 text-right">Rozdíl</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td className="border px-2 py-1">{r.name}</td>
              <td className="border px-2 py-1 text-right">{r.total.toLocaleString()}</td>
              <td className="border px-2 py-1 text-right">
                <input
                  type="number"
                  value={r.actual}
                  onChange={e => onActualChange(r.id, Number(e.target.value))}
                  className="w-20 text-right border rounded px-1"
                  min={0}
                />
              </td>
              <td className={`border px-2 py-1 text-right ${r.difference < 0 ? 'text-red-600' : ''}`}>
                {r.difference.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
