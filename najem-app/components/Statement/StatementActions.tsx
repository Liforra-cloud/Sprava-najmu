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
    // sem zavolat API, nebo router.push na generátor
    alert('PDF export zatím není implementován.')
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
