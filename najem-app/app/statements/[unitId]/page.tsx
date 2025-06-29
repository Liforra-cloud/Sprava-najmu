// app/statements/[unitId]/page.tsx

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import StatementHeader from '@/components/Statement/StatementHeader'
import SummaryCards, { SummaryData } from '@/components/Statement/SummaryCards'
import StatementTable, { PaymentsMatrix } from '@/components/Statement/StatementTable'
import AnnualSummary from '@/components/Statement/AnnualSummary'
import StatementActions from '@/components/Statement/StatementActions'

interface Props {
  params: { unitId: string }
}

// Odpověď z našeho API
interface ApiResponse {
  paymentsMatrix: PaymentsMatrix
  tenant: {
    full_name: string
    lease_end: string | null
  } | null
}

export default function StatementUnitPage({ params }: Props) {
  const { unitId } = params
  const router     = useRouter()
  const sp         = useSearchParams()

  // Výchozí období: leden–prosinec aktuálního roku
  const now         = new Date()
  const currentYear = now.getFullYear()
  const defaultFrom = `${currentYear}-01`
  const defaultTo   = `${currentYear}-12`

  const [from, setFrom] = useState(sp.get('from') ?? defaultFrom)
  const [to,   setTo]   = useState(sp.get('to')   ?? defaultTo)

  const onChangePeriod = useCallback(
    (newFrom: string, newTo: string) => {
      setFrom(newFrom)
      setTo(newTo)
      router.replace(`/statements/${unitId}?from=${newFrom}&to=${newTo}`)
    },
    [router, unitId]
  )

  const [tenantName, setTenantName] = useState<string>('–')

  const [matrix,      setMatrix]      = useState<PaymentsMatrix | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<string, number | ''>>({})
  const [chargeFlags, setChargeFlags] = useState<Record<string, boolean>>({})
  const [summary,     setSummary]     = useState<SummaryData>({
    totalCosts: 0,
    totalPaid:  0,
    balance:    0
  })

  const handleDataChange = useCallback((
    m: PaymentsMatrix,
    pv: Record<string, number | ''>,
    cf: Record<string, boolean>
  ) => {
    setMatrix(m)
    setPivotValues(pv)
    setChargeFlags(cf)
  }, [])

  // Načtení matice a jména nájemníka
  useEffect(() => {
    if (!unitId) return

    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json() as Promise<ApiResponse>
      })
      .then(data => {
        setMatrix(data.paymentsMatrix)
        setTenantName(data.tenant?.full_name ?? '–')
      })
      .catch(() => {
        setMatrix(null)
        setTenantName('–')
      })
  }, [unitId, from, to])

  // Přepočet souhrnu
  useEffect(() => {
    if (!matrix) return
    const totalCosts = Object.entries(pivotValues).reduce((sum, [k, v]) =>
      sum + (chargeFlags[k] && typeof v === 'number' ? v : 0),
      0
    )
    const totalPaid = totalCosts * 0.9  // tady váš skutečný vzorec
    const balance   = totalCosts - totalPaid
    setSummary({ totalCosts, totalPaid, balance })
  }, [pivotValues, chargeFlags, matrix])

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <StatementHeader
        titleLabel="Vyúčtování"
        tenantName={tenantName}
        from={from}
        to={to}
        onChangePeriod={onChangePeriod}
      />

      <SummaryCards data={summary} />

      {matrix && (
        <AnnualSummary
          matrix={matrix}
          pivotValues={pivotValues}
          chargeFlags={chargeFlags}
        />
      )}

      <StatementTable
        unitId={unitId}
        from={from}
        to={to}
        onDataChange={handleDataChange}
      />

      <StatementActions unitId={unitId} summary={summary} />
    </div>
  )
}
