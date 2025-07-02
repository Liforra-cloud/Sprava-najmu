
'use client'

import React from 'react'
import type { PaymentsMatrix } from './StatementTable'

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
    <table className="w-full border mb-4 text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="border p-1">Poplatek</th>
          <th className="border p-1">Vypočteno</th>
          <th className="border p-1">Reálná spotřeba</th>
          <th className="border p-1">Rozdíl</th>
        </tr>
      </thead>
      <tbody>
        {matrix.data.map(row => {
          // Vypočítat celkovou částku z hodnot row.values
          const calc = row.values.reduce<number>(
            (sum, v) => sum + (typeof v === 'number' ? v : 0),
            0
          )
          // Součet zaplacených podle pivotValues a flagů
          const paid = Object.entries(pivotValues).reduce(
            (sum, [key, val]) => {
              const parts = key.split('-')
              // parts = [year, month, id]
              const id = parts.slice(2).join('-')
              if (id === row.id && chargeFlags[key] && typeof val === 'number') {
                return sum + val
              }
              return sum
            },
            0
          )
          const diff = calc - paid
          return (
            <tr key={row.id}>
              <td className="border p-1">{row.name}</td>
              <td className="border p-1">{calc.toLocaleString()}</td>
              <td className="border p-1">{paid.toLocaleString()}</td>
              <td className={`border p-1 ${diff < 0 ? 'text-red-600' : ''}`}>
                {diff.toLocaleString()}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
