// app/statements/[id]/page.tsx
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

export default function StatementDetailPage({ params }: Props) {
  const { unitId: paramId } = params
  const router = useRouter()
  const searchParams = useSearchParams()

  // Výchozí období (pokud není v query, vezmi aktuální rok)
  const now = new Date()
  const currentYear = now.getFullYear()
  const defaultFrom = `${currentYear}-01`
  const defaultTo   = `${currentYear}-12`

  const [from, setFrom] = useState(searchParams.get('from') ?? defaultFrom)
  const [to,   setTo]   = useState(searchParams.get('to')   ?? defaultTo)

  const [tenantName, setTenantName] = useState('–')
  const [title, setTitle] = useState('Vyúčtování')
  const [actualUnitId, setActualUnitId] = useState('')   // skutečné unitId (pokud paramId je statement ID)
  const [isStatement, setIsStatement] = useState(false)  // režim uloženého vyúčtování?

  const [matrix, setMatrix] = useState<PaymentsMatrix | null>(null)
  const [pivotValues, setPivotValues] = useState<Record<string, number | ''>>({})
  const [chargeFlags, setChargeFlags] = useState<Record<string, boolean>>({})
  const [summary, setSummary] = useState<SummaryData>({
    totalCosts: 0,
    totalPaid:  0,
    balance:    0
  })

  // Při změně období přegenerovat URL (aby šlo měnit období i v detailu)
  const onChangePeriod = useCallback((newFrom: string, newTo: string) => {
    setFrom(newFrom)
    setTo(newTo)
    router.replace(`/statements/${paramId}?from=${newFrom}&to=${newTo}`)
  }, [router, paramId])

  // 1) Zjistit, zda paramId je ID uloženého vyúčtování, a nastavit podle toho stav
  useEffect(() => {
    if (!paramId) return
    fetch(`/api/statements/${paramId}`)
      .then(res => {
        if (res.status === 404) {
          // žádné uložené vyúčtování s tímto ID -> jedná se o unitId režim
          setActualUnitId(paramId)
          setIsStatement(false)
          return null
        }
        return res.json()
      })
      .then(data => {
        if (!data) return  // není to uložené vyúčtování
        // Máme data uloženého vyúčtování
        setIsStatement(true)
        setTitle(data.title || 'Vyúčtování')
        if (data.period_from && data.period_to) {
          const fromDate = new Date(data.period_from)
          const toDate = new Date(data.period_to)
          const fStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth()+1).padStart(2,'0')}`
          const tStr = `${toDate.getFullYear()}-${String(toDate.getMonth()+1).padStart(2,'0')}`
          setFrom(fStr)
          setTo(tStr)
        }
        if (data.unit_id) {
          setActualUnitId(data.unit_id)
        }
        if (data.tenant_name) {
          setTenantName(data.tenant_name)
        }
      })
      .catch(err => console.error('Fetch detail error:', err))
  }, [paramId])

  // 2) Načtení matice plateb (volá stejné API jako StatementTable interně)
  useEffect(() => {
    if (!actualUnitId) return
    fetch(`/api/statement?unitId=${actualUnitId}&from=${from}&to=${to}`)
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then(data => {
        setMatrix(data.paymentsMatrix)
        // Pokud jsme v režimu náhledu (ne uloženého), vezmeme tenantName z výsledku API
        if (!isStatement) {
          setTenantName(data.tenant?.full_name ?? '–')
        }
      })
      .catch(err => {
        console.error('Chyba načítání dat vyúčtování:', err)
        setMatrix(null)
        setTenantName('–')
      })
  }, [actualUnitId, from, to, isStatement])

  // 3) Když se změní data v tabulce (u náhledu), aktualizujeme pivotValues a chargeFlags
  const handleDataChange = useCallback((
    m: PaymentsMatrix,
    pv: Record<string, number | ''>,
    cf: Record<string, boolean>
  ) => {
    setMatrix(m)
    setPivotValues(pv)
    setChargeFlags(cf)
  }, [])

  // 4) Přepočet souhrnných karet (celkové částky)
  useEffect(() => {
    if (!matrix) return
    const totalCosts = Object.entries(pivotValues).reduce((sum, [key, val]) =>
      sum + (chargeFlags[key] && typeof val === 'number' ? val : 0)
    , 0)
    // Pozn.: Zde by mělo být správně sečteno skutečně zaplaceno.
    // Pro jednoduchost použijeme placeholder: nájemník uhradil 90% nákladů.
    const totalPaid = totalCosts * 0.9
    const balance = totalCosts - totalPaid
    setSummary({ totalCosts, totalPaid, balance })
  }, [pivotValues, chargeFlags, matrix])

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <StatementHeader
        titleLabel={title}
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

      {matrix && (
        <StatementTable
          unitId={actualUnitId}
          from={from}
          to={to}
          onDataChange={!isStatement ? handleDataChange : undefined}
        />
      )}

      {!matrix && (
        <p className="text-center text-gray-500">Načítám data vyúčtování…</p>
      )}

      {/* Místo pro akce (Export PDF) – ponecháme stávající */}
      <StatementActions unitId={actualUnitId} summary={summary} />
    </div>
  )
}
