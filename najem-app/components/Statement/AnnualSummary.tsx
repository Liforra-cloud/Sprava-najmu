// components/Statement/AnnualSummary.tsx


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
          const calc = row.total
          const paid = Object.entries(pivotValues).reduce((sum,[key,val]) => {
            const [y,m,id] = key.split('-')
            if (id===row.id && chargeFlags[key] && typeof val==='number') {
              return sum + val
            }
            return sum
          },0)
          const diff = calc - paid
          return (
            <tr key={row.id}>
              <td className="border p-1">{row.name}</td>
              <td className="border p-1">{calc.toLocaleString()}</td>
              <td className="border p-1">
                {/* sem můžete doplnit input pro skutečnou hodnotu */}
              </td>
              <td className={`border p-1 ${diff<0?'text-red-600':''}`}>
                {diff.toLocaleString()}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
