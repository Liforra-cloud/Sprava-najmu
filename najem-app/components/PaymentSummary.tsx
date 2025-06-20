// components/PaymentSummary.tsx

'use client'

import { useEffect, useState } from 'react'

type SummaryData = {
  paidThisMonth:   number  // 📆 Zaplaceno tento měsíc
  rentThisMonth:   number  // 💰 Nájemné tento měsíc
  monthDebt:       number  // ⚠️ Dluh tento měsíc
  totalDebt:       number  // 📄 Celkový dluh
  totalPaid:       number  // 📊 Celkem zaplaceno
  owes:            boolean // true pokud je celkový dluh > 0 nebo měsíční dluh > 0
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
        const json = await res.json() as SummaryData
        setData(json)
      } catch (err: unknown) {
        console.error(err)
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Neznámá chyba')
        }
      } finally {
        setLoading(false)
      }
    }
    if (tenantId) fetchSummary()
  }, [tenantId])

  if (loading) return <p>Načítám souhrn plateb…</p>
  if (error)   return <p className="text-red-600">⚠️ {error}</p>
  if (!data)  return null

  return (
    <div className="p-4 border rounded-xl shadow bg-white mt-4">
      <h2 className="text-xl font-bold mb-3">Souhrn nájemného</h2>
      <div className="space-y-1 text-lg">
        <p>📆 Zaplaceno tento měsíc: <strong>{data.paidThisMonth} Kč</strong></p>
        <p>💰 Nájemné tento měsíc: <strong>{data.rentThisMonth} Kč</strong></p>
        {data.monthDebt > 0 && (
          <p className="text-red-600">⚠️ Dluh tento měsíc: <strong>{data.monthDebt} Kč</strong></p>
        )}
        <p>📄 Celkový dluh: <strong>{data.totalDebt} Kč</strong></p>
        <p>📊 Celkem zaplaceno: <strong>{data.totalPaid} Kč</strong></p>
        {data.owes ? (
          <p className="text-red-700 font-semibold">⚠️ Nájemník má dluh</p>
        ) : (
          <p className="text-green-700 font-semibold">✅ Vše uhrazeno</p>
        )}
      </div>
    </div>
  )
}
