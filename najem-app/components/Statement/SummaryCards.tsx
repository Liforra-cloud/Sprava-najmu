// components/Statement/SummaryCards.tsx
'use client'

import React from 'react'

export type SummaryData = {
  totalCosts: number
  totalPaid:  number
  balance:    number
}

interface Props {
  data: SummaryData
}

export default function SummaryCards({ data }: Props) {
  const { totalCosts, totalPaid, balance } = data
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 bg-white shadow rounded">
        <div className="text-sm font-medium text-gray-500">Celkem náklady</div>
        <div className="mt-1 text-2xl font-bold">{totalCosts.toLocaleString()} Kč</div>
      </div>
      <div className="p-4 bg-white shadow rounded">
        <div className="text-sm font-medium text-gray-500">Celkem zálohy</div>
        <div className="mt-1 text-2xl font-bold">{totalPaid.toLocaleString()} Kč</div>
      </div>
      <div className={`p-4 shadow rounded ${balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="text-sm font-medium text-gray-500">Doplatek / Přeplatek</div>
        <div className="mt-1 text-2xl font-bold">
          {balance >= 0 ? '+' : '-'}{Math.abs(balance).toLocaleString()} Kč
        </div>
      </div>
    </div>
  )
}
