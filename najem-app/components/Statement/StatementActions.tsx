// components/Statement/StatementActions.tsx
'use client'

import React from 'react'
import { SummaryData } from './SummaryCards'

export default function StatementActions({
  unitId,
  summary
}: {
  unitId: string
  summary: SummaryData
}) {
  const handleSave = () => {
    // TODO: sem přidat skutečné volání API pro uložení celého vyúčtování
    alert('Vyúčtování uloženo.')
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
