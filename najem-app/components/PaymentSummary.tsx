// najem-app/components/PaymentSummary.tsx

'use client'

import { useEffect, useState } from 'react'

type SummaryData = {
  totalDue:       number
  totalPaid:      number
  paidThisMonth:  number
  totalDebt:      number
  debtThisMonth:  number
  owes:           boolean
}

export default function PaymentSummary({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/tenants/${tenantId}/summary`)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(json => setData(json))
      .catch(err => {
        console.error(err)
        setError('Chyba při načítání souhrnu')
      })
      .finally(() => setLoading(false))
  }, [tenantId])

  if (loading) return <p>Načítám souhrn…</p>
  if (error)   return <p className="text-red-600">{error}</p>
  if (!data)  return null

  return (
    <div className="p-4 border rounded-xl shadow bg-white mt-4">
      <h2 className="text-xl font-bold mb-3">Souhrn nájemného</h2>
      <div className="space-y-1">
        <p>💰 Celkem dlužné: <strong>{data.totalDebt} Kč</strong></p>
        <p>📆 Zaplaceno tento měsíc: <strong>{data.paidThisMonth} Kč</strong></p>
        <p>📊 Celkem zaplaceno: <strong>{data.totalPaid} Kč</strong></p>
        <p className={data.totalDebt > 0 ? 'text-red-600' : ''}>
          📄 Celkový dluh: <strong>{data.totalDue - data.totalPaid} Kč</strong>
        </p>
        <p className={data.debtThisMonth > 0 ? 'text-red-600' : ''}>
          ⚠️ Dluh tento měsíc: <strong>{data.debtThisMonth} Kč</strong>
        </p>
        {data.owes ? (
          <p className="text-red-700 font-semibold">⚠️ Nájemník má dluh</p>
        ) : (
          <p className="text-green-700 font-semibold">✅ Vše uhrazeno</p>
        )}
      </div>
    </div>
  )
}

