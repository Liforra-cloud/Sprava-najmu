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

export default function StatementUnitPage({ params }: Props) {
  const { unitId } = params
  const router     = useRouter()
  const sp         = useSearchParams()

  // Výchozí období: leden–prosinec aktuálního roku
  const now      = new Date()
  const year     = now.getFullYear()
  const defaultFrom = `${year}-01`
  const defaultTo   = `${year}-12`

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

  // Data tabulky
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

  // Jméno nájemníka
  const [tenantName, setTenantName] = useState<string>('–')

  // Načtení jména nájemníka (a matrix) na změnu unitId, from, to
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
        // nastavit matrix a přeposlat data tabulce
        setMatrix(data.paymentsMatrix)
        // zpracování pivotValues a chargeFlags už ošetří StatementTable přes onDataChange
        // načtení jména
        if (data.tenant) {
          setTenantName(data.tenant.full_name)
        } else {
          setTenantName('–')
        }
      })
      .catch(() => {
        setTenantName('–')
        setMatrix(null)
      })
  }, [unitId, from, to])

  // Přepočet souhrnu po změně pivotValues / chargeFlags
  useEffect(() => {
    if (!matrix) return
    const totalCosts = Object.entries(pivotValues).reduce((sum, [key, val]) => {
      return sum + (chargeFlags[key] && typeof val === 'number' ? val : 0)
    }, 0)
    const totalPaid = totalCosts * 0.9   // <<< sem vložte skutečný výpočet
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
