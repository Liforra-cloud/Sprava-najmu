/najem-app/components/TenantPaymentHistory.tsx


'use client'

import { useEffect, useState } from 'react'

type Payment = {
  id: string
  amount: number
  payment_date: string
  note?: string
  payment_month?: string
}

export default function TenantPaymentHistory({ tenantId }: { tenantId: string }) {
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const fetchPayments = async () => {
      const res = await fetch(`/api/tenants/${tenantId}/payments`)
      const data = await res.json()
      setPayments(data)
    }
    fetchPayments()
  }, [tenantId])

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">Historie plateb</h2>
      {payments.length === 0 ? (
        <p>Žádné platby nenalezeny.</p>
      ) : (
        <ul className="border rounded divide-y">
          {payments.map((payment) => (
            <li key={payment.id} className="p-2 flex justify-between">
              <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
              <span>{payment.amount} Kč</span>
              <span className="text-sm text-gray-500">{payment.note || ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
