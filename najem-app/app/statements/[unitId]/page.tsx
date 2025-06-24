// app/statements/[unitId]/page.tsx

'use client'

import React, { useEffect, useState } from 'react'
import StatementTable, { StatementItem } from '@/components/StatementTable'
import { useSearchParams } from 'next/navigation'

export default function StatementUnitPage({ params }: { params: { unitId: string } }) {
  const { unitId } = params
  const [items, setItems] = useState<StatementItem[]>([])
  const [allCharges, setAllCharges] = useState<StatementItem[]>([])
  const searchParams = useSearchParams()

  // Default období: tento rok
  const now = new Date()
  const defaultFrom = `${now.getFullYear()}-01`
  const defaultTo = `${now.getFullYear()}-12`
  const from = searchParams.get('from') || defaultFrom
  const to = searchParams.get('to') || defaultTo

  useEffect(() => {
    fetch(`/api/statements?unitId=${unitId}&from=${from}&to=${to}`)
      .then(r => r.json())
      .then(({ items, allCharges }) => {
        setItems(items)
        setAllCharges(allCharges)
      })
  }, [unitId, from, to])

  const handleAddCharge = async (obligationId: string, type: string, amount: number) => {
    await fetch('/api/statements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ obligationId, type, amount }),
    })
    // Po přidání refetch
    fetch(`/api/statements?unitId=${unitId}&from=${from}&to=${to}`)
      .then(r => r.json())
      .then(({ items, allCharges }) => {
        setItems(items)
        setAllCharges(allCharges)
      })
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Účtování poplatků – jednotka</h1>
      <StatementTable unitId={unitId} from={from} to={to} />
    </div>
  )
}
