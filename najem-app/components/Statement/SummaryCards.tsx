// components/Statement/SummaryCards.tsx

'use client'

import React from 'react'

export type SummaryData = {
  totalCosts: number
  totalPaid:  number
  balance:    number
}

export default function SummaryCards({
  data: { totalCosts, totalPaid, balance }
}: {
  data: SummaryData
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-sm text-gray-500">Náklady celkem</h3>
        <p className="text-xl font-bold">{totalCosts.toFixed(2)}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-sm text-gray-500">Zaplatili</h3>
        <p className="text-xl font-bold">{totalPaid.toFixed(2)}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-sm text-gray-500">Zůstatek</h3>
        <p className="text-xl font-bold">{balance.toFixed(2)}</p>
      </div>
    </div>
  )
}

