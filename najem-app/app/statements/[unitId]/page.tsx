// app/statements/[unitId]/page.tsx

'use client'

import React from 'react'
import StatementTable from '@/components/StatementTable'
import { useSearchParams } from 'next/navigation'

export default function StatementUnitPage({ params }: { params: { unitId: string } }) {
  const { unitId } = params
  const searchParams = useSearchParams()

  // Default období: tento rok
  const now = new Date()
  const defaultFrom = `${now.getFullYear()}-01`
  const defaultTo = `${now.getFullYear()}-12`
  const from = searchParams.get('from') || defaultFrom
  const to = searchParams.get('to') || defaultTo

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Účtování poplatků – jednotka</h1>
      <StatementTable unitId={unitId} from={from} to={to} />
    </div>
  )
}

