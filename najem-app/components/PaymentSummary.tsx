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

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/tenants/${tenantId}/summary`)
        if (!res.ok) throw new Error('Chyba při načítání souhrnu')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [tenantId])

  if (loading) return <p>Načítám souhrn plateb…</p>
  if (!data) return <p>Souhrn plateb nelze načíst.</p>

  return (
    <div className="p-4 border rounded-xl shadow bg-white mt-4">
      <h2 className="text-xl font-bold mb-3">Souhrn nájemného</h2>
      <div className="space-y-1">
        <p>💰 Celkem dlužné: <strong>{data.totalDebt} Kč</strong></p>
        <p>📆 Zaplaceno tento měsíc: <strong>{data.paidThisMonth} Kč</strong></p>
        <p>📊 Celkem zaplaceno: <strong>{data.totalPaid} Kč</strong></p>
        <p className={data.totalDue - data.totalPaid > 0 ? 'text-red-600' : ''}>
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

