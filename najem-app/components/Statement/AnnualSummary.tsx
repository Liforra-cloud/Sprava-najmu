// components/Statement/AnnualSummary.tsx


'use client'

import React from 'react'
import { PaymentsMatrix } from './StatementTable'

export default function AnnualSummary({
  matrix,
  pivotValues,
  chargeFlags
}: {
  matrix: PaymentsMatrix
  pivotValues: Record<string, number | ''>
  chargeFlags: Record<string, boolean>
}) {
  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-2">Přehled období</h2>
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-1 text-left">Poplatek</th>
            <th className="border p-1 text-right">Součet</th>
          </tr>
        </thead>
        <tbody>
          {matrix.data.map(row => {
            const total = matrix.months.reduce((sum, m) => {
              const key = `${m.year}-${m.month}-${row.id}`
              const val = pivotValues[key]
              return sum + (chargeFlags[key] && typeof val === 'number' ? val : 0)
            }, 0)
            return (
              <tr key={row.id}>
                <td className="border p-1">{row.name}</td>
                <td className="border p-1 text-right">{total.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
  
