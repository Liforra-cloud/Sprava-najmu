/najem-app/components/TenantPaymentHistory.tsx


'use client'

import { useEffect, useState } from 'react'

type Payment = {
  id: string
  amount: number
  payment_date: string
  payment_type?: string
  note?: string
  lease_id?: string
  payment_month?: string
}

type Props = {
  tenantId: string
}

export default function TenantPaymentHistory({ tenantId }: Props) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/payments?tenant_id=${tenantId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPayments(data)
        } else if (Array.isArray(data.payments)) {
          setPayments(data.payments)
        } else {
          throw new Error('Neplatná odpověď z API')
        }
      })
      .catch(err => {
        console.error(err)
        setError('Nepodařilo se načíst platby.')
        setPayments([])
      })
      .finally(() => setLoading(false))
  }, [tenantId])

  if (loading) return <div>Načítání...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (payments.length === 0) return <div>Žádné platby nenalezeny.</div>

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold">Historie plateb</h3>
      <ul className="divide-y border rounded">
        {payments.map(payment => (
          <li key={payment.id} className="p-2 flex justify-between items-center">
            <div>
              <div className="font-medium">
                {new Date(payment.payment_date).toLocaleDateString('cs-CZ')}
              </div>
              <div className="text-xs text-gray-500">{payment.note}</div>
            </div>
            <div className="text-right">
              <div>{payment.amount} Kč</div>
              {payment.payment_type && (
                <div className="text-xs text-gray-500">{payment.payment_type}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
