// components/Statement/StatementActions.tsx

'use client'

import React from 'react'
import { SummaryData } from './SummaryCards'

export default function StatementActions({
  unitId,
  summary
}: {
  unitId:  string
  summary: SummaryData
}) {
  const exportPdf = () => {
    // využijeme oba props, aby ESLint nehlásil unused-vars
    console.log('Export PDF pro jednotku', unitId, 'se souhrnem', summary)
    alert(`Export PDF pro jednotku ${unitId}\nCelkem: ${summary.totalCosts}`)
  }

  return (
    <div className="flex justify-end space-x-2">
      <button
        onClick={exportPdf}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Export PDF
      </button>
    </div>
  )
}
