// app/statements/[unitId]/page.tsx

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  const { unitId }   = params
  const router       = useRouter()
  const sp           = useSearchParams()

  // výchozí období (leden–prosinec aktuálního roku)
  const now = new Date()
  const defFrom = `${now.getFullYear()}-01`
  const defTo   = `${now.getFullYear()}-12`
  const fromParam = sp.get('from') ?? defFrom
  const toParam   = sp.get('to')   ?? defTo

  const [from, setFrom] = useState(fromParam)
  const [to,   setTo]   = useState(toParam)

  // **Nově**: nájemník
  const [tenantName, setTenantName] = useState<string>('–')

  // Při změně období udržujeme URL i stav
  const onChangePeriod = useCallback(
    (newFrom: string, newTo: string) => {
      setFrom(newFrom)
      setTo(newTo)
      router.replace(`/statements/${unitId}?from=${newFrom}&to=${newTo}`)
    },
    [router, unitId]
  )

  // Stav pro tabulku
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

  // Při každé změně unitId, from, to stáhneme jméno nájemníka
  useEffect(() => {
    if (!unitId) return

    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json() as Promise<{
          paymentsMatrix: PaymentsMatrix
          overrides: any[]
          tenant: { full_name: string; lease_end: string | null } | null
        }>
      })
      .then(data => {
        if (data.tenant) {
          setTenantName(data.tenant.full_name)
        } else {
          setTenantName('–')
        }
      })
      .catch(() => {
        setTenantName('–')
      })
  }, [unitId, from, to])

  // ... zbytek PAGE zůstává beze změny ...

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <StatementHeader
        titleLabel="Vyúčtování"
        from={from}
        to={to}
+       tenantName={tenantName}
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


