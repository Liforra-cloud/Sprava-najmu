components/LeasePaymentList.tsx

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

export default function LeasePaymentList({ leaseId }: Props) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/leases/${leaseId}/payments`)
      const data = await res.json()
      setPayments(data)
    }
    load()
  }, [leaseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch(`/api/leases/${leaseId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        payment_date: date,
        note
      })
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Chyba při odesílání platby')
    } else {
      setPayments([data, ...payments])
      setAmount('')
      setDate('')
      setNote('')
      setError('')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold">Záznamy plateb</h3>

      {payments.length === 0 ? (
        <p>Žádné platby zatím nejsou.</p>
      ) : (
        <ul className="divide-y border rounded">
          {payments.map(p => (
            <li key={p.id} className="p-2 flex justify-between">
              <span>{new Date(p.payment_date).toLocaleDateString('cs-CZ')}</span>
              <span>{p.amount} Kč</span>
              <span className="text-sm text-gray-500">{p.note}</span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label>Datum platby:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label>Částka:</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label>Poznámka (nepovinné):</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          Přidat platbu
        </button>
      </form>
    </div>
  )
}
