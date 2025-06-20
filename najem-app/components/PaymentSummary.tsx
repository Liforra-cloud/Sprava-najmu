// components/PaymentSummary.tsx

'use client'

import { useEffect, useState } from 'react'

type SummaryData = {
  paidThisMonth: number   // 📆 Zaplaceno tento měsíc
  rentThisMonth: number   // 💰 Nájemné tento měsíc
  monthDebt: number       // ⚠️ Dluh tento měsíc (jen po splatnosti)
  totalDebt: number       // 📄 Celkový dluh (nezaplacené minulých měsíců + aktuální po splatnosti)
  owes: boolean           // true pokud je totalDebt > 0
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
        <p>
          📆 Zaplaceno tento měsíc:{' '}
          <strong>{data.paidThisMonth} Kč</strong>
        </p>
        <p>
          💰 Nájemné tento měsíc:{' '}
          <strong>{data.rentThisMonth} Kč</strong>
        </p>
        <p className={data.monthDebt > 0 ? 'text-red-600' : ''}>
          ⚠️ Dluh tento měsíc:{' '}
          <strong>{data.monthDebt} Kč</strong>
        </p>
        <p className={data.totalDebt > 0 ? 'text-red-600' : ''}>
          📄 Celkový dluh:{' '}
          <strong>{data.totalDebt} Kč</strong>
        </p>
        {data.owes ? (
          <p className="text-red-700 font-semibold">
            ⚠️ Nájemník má dluh
          </p>
        ) : (
          <p className="text-green-700 font-semibold">
            ✅ Vše uhrazeno
          </p>
        )}
      </div>
    </div>
  )
}
