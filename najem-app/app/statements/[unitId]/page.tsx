// app/statements/[unitId]/page.tsx

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StatementHeader from '@/components/Statement/StatementHeader'
import SummaryCards, { SummaryData } from '@/components/Statement/SummaryCards'
import StatementTable, { PaymentsMatrix, CellKey } from '@/components/Statement/StatementTable'
import AnnualSummary from '@/components/Statement/AnnualSummary'
import StatementActions from '@/components/Statement/StatementActions'

export default function StatementPage({ params }: { params: { unitId: string } }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const unitId       = params.unitId
  const from         = searchParams.get('from') || `${new Date().getFullYear()}-01`
  const to           = searchParams.get('to')   || `${new Date().getFullYear()}-12`

  // pokud by někdo zkusil přejít bez unitId
  if (!unitId) {
    return <div className="p-4 text-center">Vyberte prosím jednotku.</div>
  }

  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({})
  const [actuals,     setActuals]     = useState<Record<string, number>>({})
  const [summary,     setSummary]     = useState<SummaryData>({ totalCosts:0, totalPaid:0, balance:0 })

  // Po načtení matrixu počítat summary
  useEffect(() => {
    if (!matrix) return

    const totalCosts = Object
      .values(pivotValues)
      .reduce((s: number, v) => s + (typeof v === 'number' ? v : 0), 0)
    const totalPaid = totalCosts * 0.9
    const balance   = totalCosts - totalPaid

    setSummary({ totalCosts, totalPaid, balance })
  }, [matrix, pivotValues])

  const handleActualChange = (id: string, v: number) =>
    setActuals(a => ({ ...a, [id]: v }))

  const handleSave        = () => alert('TODO: uložit vyúčtování')
  const handleExportPDF   = () => alert('TODO: export PDF')
  const handleExportExcel = () => alert('TODO: export Excel')

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <StatementHeader
        from={from}
        to={to}
        titleLabel="Vyúčtování"
        onChangePeriod={(f, t) => router.push(`/statements/${unitId}?from=${f}&to=${t}`)}
      />

      {/* Summary karty – jen když máme data */}
      {matrix && <SummaryCards data={summary} />}

      {/* Roční souhrn nad tabulkou – jen s data */}
      {matrix && (
        <AnnualSummary
          matrix={matrix}
          pivotValues={pivotValues}
          actuals={actuals}
          onActualChange={handleActualChange}
        />
      )}

      {/* Tabulka měsíčních nákladů */}
      <StatementTable
        unitId={unitId}
        from={from}
        to={to}
        onDataChange={(m, pv) => { setMatrix(m); setPivotValues(pv) }}
      />

      <StatementActions
        onSave={handleSave}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
      />
    </div>
  )
}
