// components/Statement/StatementActions.tsx
'use client'

import React from 'react'

interface StatementActionsProps {
  onSave:        () => void
  onExportPDF:   () => void
  onExportExcel: () => void
}

export default function StatementActions({
  onSave,
  onExportPDF,
  onExportExcel
}: StatementActionsProps) {
  return (
    <div className="flex gap-4">
      <button
        onClick={onSave}
        className="px-4 py-2 bg-green-600 text-white rounded shadow"
      >
        Uložit vyúčtování
      </button>
      <button
        onClick={onExportPDF}
        className="px-4 py-2 bg-blue-600 text-white rounded shadow"
      >
        Export PDF
      </button>
      <button
        onClick={onExportExcel}
        className="px-4 py-2 bg-gray-600 text-white rounded shadow"
      >
        Export Excel
      </button>
    </div>
  )
}
