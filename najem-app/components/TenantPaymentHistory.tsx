//najem-app/components/TenantPaymentHistory.tsx


'use client'

import { useEffect, useState } from 'react'

type Payment = {
  id: string
  amount: number
  payment_date: string
  note?: string
  payment_type?: string
}

type Props = {
  leaseId: string
}

export default function TenantPaymentHistory({ leaseId }: Props) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [paymentType, setPaymentType] = useState('')

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leases/${leaseId}/payments`)
      const data = await res.json()
      if (res.ok) {
        setPayments(data)
      } else {
        setError(data.error || 'Chyba při načítání plateb')
      }
    } catch (err) {
      console.error(err)
      setError('Chyba při načítání plateb')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [leaseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/leases/${leaseId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          payment_date: date,
          note,
          payment_type: paymentType
        })
      })

      if (!res.ok) throw new Error(await res.text())
      setAmount('')
      setDate('')
      setNote('')
      setPaymentType('')
      fetchPayments()
    } catch (err) {
      console.error(err)
      alert('Chyba při ukládání platby.')
    }
  }

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-lg font-semibold">Historie plateb</h3>

      {loading && <p>Načítání...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {payments.length === 0 && !loading && <p>Žádné platby.</p>}

      <ul className="divide-y border rounded text-sm">
        {payments.map(payment => (
          <li key={payment.id} className="flex justify-between p-2">
            <div>
              <div className="font-medium">
                {new Date(payment.payment_date).toLocaleDateString('cs-CZ')}
              </div>
              <div className="text-xs text-gray-500">{payment.note}</div>
            </div>
            <div className="text-right">
              <div>{payment.amount} Kč</div>
              <div className="text-xs text-gray-500">{payment.payment_type}</div>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-2 border-t pt-4">
        <h4 className="text-md font-semibold">Přidat platbu</h4>

        <input
          type="number"
          placeholder="Částka"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <input
          type="date"
          placeholder="Datum platby"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Poznámka"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Typ platby"
          value={paymentType}
          onChange={e => setPaymentType(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Uložit platbu
        </button>
      </form>
    </div>
  )
}
