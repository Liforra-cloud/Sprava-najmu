// najem-app/components/PaymentSummary.tsx

'use client'

import { useEffect, useState } from 'react'

type SummaryData = {
  totalRent: number
  totalDebt: number
  monthRent: number
  monthDebt: number
  owes: boolean
}

export default function PaymentSummary({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/tenants/${tenantId}/summary`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Chyba při načítání souhrnu:', err)
      } finally {
        setLoading(false)
      }
    }

    if (tenantId) {
      fetchSummary()
    }
  }, [tenantId])

  if (loading) return <p>Načítám souhrn plateb…</p>
  if (!data) return <p>Souhrn plateb nelze načíst.</p>

  return (
    <div className="p-4 border rounded-xl shadow bg-white mt-4">
      <h2 className="text-xl font-bold mb-3">Souhrn nájemného</h2>
      <div className="space-y-1">
        <p>💰 Celkové nájemné: <strong>{data.totalRent} Kč</strong></p>
        <p>📆 Tento měsíc zaplaceno: <strong>{data.monthRent} Kč</strong></p>
        <p className={data.totalDebt > 0 ? 'text-red-600' : ''}>
          📉 Celkový dluh: <strong>{data.totalDebt} Kč</strong>
        </p>
        <p className={data.monthDebt > 0 ? 'text-red-600' : ''}>
          📉 Dluh za tento měsíc: <strong>{data.monthDebt} Kč</strong>
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
