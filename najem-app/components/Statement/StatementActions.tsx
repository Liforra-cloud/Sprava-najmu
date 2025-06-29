// components/Statement/StatementActions.tsx


'use client'

import React from 'react'
import { SummaryData } from './SummaryCards'

interface Props {
  unitId:  string
  summary: SummaryData
}

export default function StatementActions({ unitId, summary }: Props) {
  const handleSave = async () => {
    // Uložíme celé vyúčtování na server
    await fetch('/api/statements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId,
        totalCosts: summary.totalCosts,
        totalPaid:  summary.totalPaid,
        balance:    summary.balance
      })
    })
    alert(`Vyúčtování pro jednotku ${unitId} uloženo.`)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleSave}
        className="px-3 py-1 bg-green-600 text-white rounded"
      >
        Uložit vyúčtování
      </button>
      <button
        onClick={() => window.print()}
        className="px-3 py-1 bg-gray-600 text-white rounded"
      >
        Tisk / Export
      </button>
    </div>
  )
}

