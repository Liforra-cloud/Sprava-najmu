// components/PaymentSummary.tsx

'use client'

import { useEffect, useState } from 'react'

type SummaryData = {
  totalDue: number       // „Celkem dlužné“ (součet povinností do dneška)
  totalPaid: number      // „Celkem zaplaceno“
  paidThisMonth: number  // „Zaplaceno tento měsíc“
  totalDebt: number      // „Celkový dluh“ (totalDue − totalPaid)
  monthDebt: number      // „Dluh tento měsíc“ (monthRent − paidThisMonth)
  owes: boolean
}

export default function PaymentSummary({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true)
      try {
        const res = await fetch(`/api/tenants/${tenantId}/summary`)
        if (!res.ok) throw new Error('Chyba při načítání souhrnu')
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Neznámá chyba')
      } finally {
        setLoading(false)
      }
    }
    if (tenantId) fetchSummary()
  }, [tenantId])

  if (loading) return <p>Načítám souhrn plateb…</p>
  if (error) return <p className="text-red-600">⚠️ {error}</p>
  if (!data) return null

  return (
    <div className="p-4 border rounded-xl shadow bg-white mt-4">
      <h2 className="text-xl font-bold mb-3">Souhrn nájemného</h2>
      <div className="space-y-1">
        <p>💰 Celkem dlužné: <strong>{data.totalDue} Kč</strong></p>
        <p>📆 Zaplaceno tento měsíc: <strong>{data.paidThisMonth} Kč</strong></p>
        <p>📊 Celkem zaplaceno: <strong>{data.totalPaid} Kč</strong></p>
        <p className={data.totalDebt > 0 ? 'text-red-600' : ''}>
          📄 Celkový dluh: <strong>{data.totalDebt} Kč</strong>
        </p>
        <p className={data.monthDebt > 0 ? 'text-red-600' : ''}>
          ⚠️ Dluh tento měsíc: <strong>{data.monthDebt} Kč</strong>
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
