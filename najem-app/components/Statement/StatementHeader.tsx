// components/Statement/StatementHeader.tsx

'use client'

import React from 'react'

interface Props {
  /** Od které doby */
  from: string
  /** Do které doby */
  to: string
  /** Titulek vyúčtování */
  titleLabel: string
  /** Callback při změně období */
  onChangePeriod: (from: string, to: string) => void
}

export default function StatementHeader({
  from,
  to,
  titleLabel,
  onChangePeriod
}: Props) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">{titleLabel}</h1>
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
