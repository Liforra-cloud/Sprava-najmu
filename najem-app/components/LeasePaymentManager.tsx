//najem-app/components/LeasePaymentManager.tsx

'use client'

import { useCallback, useEffect, useState } from 'react'

type Payment = {
  id: string
  amount: number
  payment_date: string
  note?: string
  payment_type?: string
  variable_symbol?: string
  payment_month?: string
}

type Props = {
  leaseId: string
}

export default function LeasePaymentManager({ leaseId }: Props) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadPayments = useCallback(async () => {
    const res = await fetch(`/api/leases/${leaseId}/payments`)
    if (res.ok) {
      const data = await res.json()
      setPayments(data)
    } else {
      setError('Nepodařilo se načíst platby.')
    }
  }, [leaseId])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/leases/${leaseId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        payment_date: date,
        note
      })
    })

    if (res.ok) {
      setAmount('')
      setDate('')
      setNote('')
      loadPayments()
    } else {
      setError('Nepodařilo se uložit platbu.')
    }
  }

  const handleDelete = async (paymentId: string) => {
    const res = await fetch(`/api/payments/${paymentId}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      loadPayments()
    } else {
      setError('Chyba při mazání platby.')
    }
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold">Platby</h3>

      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap items-end">
        <input
          type="number"
          placeholder="Částka"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Poznámka"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Přidat platbu
        </button>
      </form>

      <ul className="divide-y border rounded text-sm">
        {payments.map(payment => (
          <li key={payment.id} className="flex justify-between items-center p-2">
            <div>
              <div className="font-medium">
                {new Date(payment.payment_date).toLocaleDateString('cs-CZ')} – {payment.amount} Kč
              </div>
              {payment.note && <div className="text-xs text-gray-500">{payment.note}</div>}
            </div>
            <button
              onClick={() => handleDelete(payment.id)}
              className="text-red-600 text-xs"
            >
              Smazat
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
