/najem-app/components/TenantPaymentHistory.tsx


'use client'

import { useEffect, useState } from 'react'

type Payment = {
  id: string
  amount: number
  payment_date: string
  payment_type?: string
  note?: string
  lease: {
    name?: string
  }
}

type Props = {
  tenantId: string
}

export default function TenantPaymentHistory({ tenantId }: Props) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      const res = await fetch(`/api/tenants/${tenantId}/payments`)
      const data = await res.json()
      setPayments(data)
      setLoading(false)
    }
    fetchPayments()
  }, [tenantId])

  if (loading) return <p>Načítání plateb…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Historie plateb</h2>

      {payments.length === 0 ? (
        <p>Žádné platby zatím nejsou zaznamenány.</p>
      ) : (
        <ul className="border rounded divide-y">
          {payments.map(payment => (
            <li key={payment.id} className="p-3 flex flex-col sm:flex-row justify-between gap-2">
              <span className="text-sm text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</span>
              <span>{payment.amount.toFixed(2)} Kč</span>
              <span className="text-sm italic">{payment.payment_type || 'neznámý typ'}</span>
              {payment.note && <span className="text-gray-500 text-sm">Pozn.: {payment.note}</span>}
              {payment.lease?.name && <span className="text-gray-500 text-sm">Smlouva: {payment.lease.name}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
