// components/Statement/SummaryCards.tsx

'use client'

import React from 'react'

export type SummaryData = {
  totalCosts: number
  totalPaid:  number
  balance:    number
}

export default function SummaryCards({ data }: { data: SummaryData }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-white border rounded shadow">
        <h2 className="text-sm font-medium text-gray-500">Vypočteno</h2>
        <p className="mt-2 text-xl font-bold">{data.totalCosts.toLocaleString()}</p>
      </div>
      <div className="p-4 bg-white border rounded shadow">
        <h2 className="text-sm font-medium text-gray-500">Reálně uhrazeno</h2>
        <p className="mt-2 text-xl font-bold">{data.totalPaid.toLocaleString()}</p>
      </div>
      <div className={`p-4 border rounded shadow ${
        data.balance >= 0 ? 'bg-green-50' : 'bg-red-50'
      }`}>
        <h2 className="text-sm font-medium text-gray-500">Rozdíl</h2>
        <p className="mt-2 text-xl font-bold">{data.balance.toLocaleString()}</p>
      </div>
    </div>
  )
}

