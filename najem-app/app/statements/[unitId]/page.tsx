// app/statements/[unitId]/page.tsx

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import StatementHeader from '@/components/Statement/StatementHeader'
import SummaryCards, { SummaryData } from '@/components/Statement/SummaryCards'
import StatementTable, { PaymentsMatrix } from '@/components/Statement/StatementTable'
import AnnualSummary from '@/components/Statement/AnnualSummary'
import StatementActions from '@/components/Statement/StatementActions'

export default function StatementUnitPage({
  params
}: {
  params: { unitId: string }
}) {
  const { unitId } = params
  const searchParams = useSearchParams()

  // Výchozí období: celý rok
  const now = new Date()
  const defaultFrom = `${now.getFullYear()}-01`
  const defaultTo   = `${now.getFullYear()}-12`
  const from = searchParams.get('from') || defaultFrom
  const to   = searchParams.get('to')   || defaultTo

  // **Všechny hooks hned na začátku**
  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<string, number | ''>>({})
  const [chargeFlags, setChargeFlags] = useState<Record<string, boolean>>({})
  const [summary,     setSummary]     = useState<SummaryData>({
    totalCosts: 0,
    totalPaid:  0,
    balance:    0
  })

  // Volá se pokaždé z dolní tabulky (StatementTable) při změně hodnot/flagů
  const handleDataChange = useCallback((
    m: PaymentsMatrix,
    pv: Record<string, number | ''>,
    cf: Record<string, boolean>
  ) => {
    setMatrix(m)
    setPivotValues(pv)
    setChargeFlags(cf)
  }, [])

  // Přepočet souhrnu po každé změně pivotValues nebo chargeFlags
  useEffect(() => {
    if (!matrix) return
    const totalCosts = Object.entries(pivotValues).reduce((sum, [key, val]) => {
      return sum + (chargeFlags[key] && typeof val === 'number' ? val : 0)
    }, 0)
    const totalPaid = totalCosts * 0.9   // tady dát skutečný fetch, nebo vzorec
    const balance   = totalCosts - totalPaid
    setSummary({ totalCosts, totalPaid, balance })
  }, [pivotValues, chargeFlags, matrix])

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Hlavička s výběrem období, názvem jednotky apod. */}
      <StatementHeader unitId={unitId} from={from} to={to} />

      {/* Karty se souhrnem */}
      <SummaryCards data={summary} />

      {/* Roční (nebo obecný) přehled */}
      {matrix && (
        <AnnualSummary
          matrix={matrix}
          pivotValues={pivotValues}
          chargeFlags={chargeFlags}
        />
      )}

      {/* Dolní tabulka „Přehled plateb“ */}
      <StatementTable
        unitId={unitId}
        from={from}
        to={to}
        onDataChange={handleDataChange}
      />

      {/* Akce jako „Uložit“, „Export“ apod. */}
      <StatementActions unitId={unitId} summary={summary} />
    </div>
  )
}
