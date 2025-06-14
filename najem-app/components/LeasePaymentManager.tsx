//najem-app/components/LeasePaymentManager.tsx

'use client'

import { useEffect, useState } from 'react'

type Payment = {
  id: string
  amount: number
  payment_date: string
  payment_type?: string
  note?: string
  variable_symbol?: string
  payment_month?: string
}

type Props = {
  leaseId: string
}

export default function LeasePaymentManager({ leaseId }: Props) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newPayment, setNewPayment] = useState({
    amount: '',
    payment_date: '',
    payment_type: '',
    note: ''
  })

  useEffect(() => {
    loadPayments()
  }, [leaseId])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leases/${leaseId}/payments`)
      const data = await res.json()
      setPayments(data)
    } catch (err) {
      console.error(err)
      setError('Chyba při načítání plateb.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = confirm('Opravdu chcete platbu smazat?')
    if (!confirmed) return

    await fetch(`/api/payments/${id}`, { method: 'DELETE' })
    await loadPayments()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      amount: parseFloat(newPayment.amount),
      payment_date: newPayment.payment_date,
      payment_type: newPayment.payment_type,
      note: newPayment.note
    }
    const res = await fetch(`/api/leases/${leaseId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      setNewPayment({ amount: '', payment_date: '', payment_type: '', note: '' })
      loadPayments()
    } else {
      const err = await res.json()
      alert(err.error || 'Chyba při uložení')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-2">
        <h4 className="font-semibold">Přidat novou platbu</h4>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            step="0.01"
            placeholder="Částka"
            value={newPayment.amount}
            onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
            className="border p-2 rounded w-32"
            required
          />
          <input
            type="date"
            value={newPayment.payment_date}
            onChange={e => setNewPayment({ ...newPayment, payment_date: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Typ platby"
            value={newPayment.payment_type}
            onChange={e => setNewPayment({ ...newPayment, payment_type: e.target.value })}
            className="border p-2 rounded w-40"
          />
          <input
            type="text"
            placeholder="Poznámka"
            value={newPayment.note}
            onChange={e => setNewPayment({ ...newPayment, note: e.target.value })}
            className="border p-2 rounded flex-1"
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            Přidat
          </button>
        </div>
      </form>

      {loading ? (
        <p>Načítání plateb…</p>
      ) : payments.length === 0 ? (
        <p>Žádné platby</p>
      ) : (
        <ul className="divide-y border rounded">
          {payments.map(p => (
            <li key={p.id} className="p-2 flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {new Date(p.payment_date).toLocaleDateString('cs-CZ')} – {p.amount} Kč
                </div>
                <div className="text-sm text-gray-500">{p.note}</div>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-red-600 text-sm hover:underline"
              >
                Smazat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
