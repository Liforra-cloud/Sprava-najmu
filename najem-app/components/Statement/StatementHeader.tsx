// components/Statement/StatementHeader.tsx

'use client'

import React from 'react'

interface Props {
  from: string           // Od které doby (YYYY-MM)
  to:   string           // Do které doby
  titleLabel: string     // Titulek
  tenantName: string     // **Nově**: jméno nájemníka
  onChangePeriod: (from: string, to: string) => void
}

export default function StatementHeader({
  from,
  to,
  titleLabel,
  tenantName,
  onChangePeriod
}: Props) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{titleLabel}</h1>
        <p className="text-sm text-gray-600">Nájemník: <strong>{tenantName}</strong></p>
      </div>
      <div className="flex gap-4">
        <label>
          <span className="block text-sm font-medium">Období od:</span>
          <input
            type="month"
            value={from}
            onChange={e => onChangePeriod(e.target.value, to)}
            className="mt-1 block border rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="block text-sm font-medium">do:</span>
          <input
            type="month"
            value={to}
            onChange={e => onChangePeriod(from, e.target.value)}
            className="mt-1 block border rounded px-2 py-1"
          />
        </label>
      </div>
    </div>
  )
}
