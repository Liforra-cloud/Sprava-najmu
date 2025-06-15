//components/LeasePaymentList.tsx


'use client'

import { useEffect, useState } from 'react'

type Payment = {
  id: string
  amount: number
  payment_date: string
  payment_month?: string
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
  const [paymentMonth, setPaymentMonth] = useState('')
  const [paymentType, setPaymentType] = useState('nájemné')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Načtení plateb
  const loadPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leases/${leaseId}/payments`)
      const data = await res.json()
      setPayments(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Nepodařilo se načíst platby.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPayments()
    // eslint-disable-next-line
  }, [leaseId])

  // Přidání platby
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // ← Tohle je zásadní, musí tu být!
    setLoading(true)
    setError('')
    const res = await fetch(`/api/leases/${leaseId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        payment_date: date,
        payment_month: paymentMonth,
        payment_type: paymentType,
        note,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Chyba při odesílání platby')
    } else {
      setAmount('')
      setDate('')
      setPaymentMonth('')
      setPaymentType('nájemné')
      setNote('')
      await loadPayments()
    }
    setLoading(false)
  }

  // Smazání platby
  const handleDelete = async (id: string) => {
    if (!window.confirm('Opravdu smazat platbu?')) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/leases/${leaseId}/payments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      setError('Chyba při mazání platby')
    } else {
      await loadPayments()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold">Záznamy plateb</h3>

      {/* Formulář pro přidání nové platby */}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 mb-6">
        <div className="col-span-1">
          <label className="block mb-1 text-sm">Datum platby:</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 text-sm">Měsíc, ke kterému platba patří:</label>
          <input
            type="month"
            value={paymentMonth}
            onChange={e => setPaymentMonth(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 text-sm">Částka:</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div className="col-span-1">
          <label className="block mb-1 text-sm">Typ platby:</label>
          <select
            value={paymentType}
            onChange={e => setPaymentType(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="nájemné">Nájemné</option>
            <option value="záloha">Záloha</option>
            <option value="jiné">Jiné</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block mb-1 text-sm">Poznámka (nepovinné):</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        {error && <div className="col-span-2 text-red-600">{error}</div>}
        <div className="col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Přidat platbu
          </button>
        </div>
      </form>

      {/* Tabulka plateb */}
      {loading ? (
        <div>Načítání…</div>
      ) : payments.length === 0 ? (
        <p>Žádné platby zatím nejsou.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Datum platby</th>
                <th className="p-2 text-left">Měsíc</th>
                <th className="p-2 text-right">Částka</th>
                <th className="p-2 text-left">Typ</th>
                <th className="p-2 text-left">Poznámka</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{new Date(p.payment_date).toLocaleDateString('cs-CZ')}</td>
                  <td className="p-2">{p.payment_month || '-'}</td>
                  <td className="p-2 text-right">{p.amount} Kč</td>
                  <td className="p-2">{p.payment_type || '-'}</td>
                  <td className="p-2">{p.note || '-'}</td>
                  <td className="p-2">
                    <button
                      className="text-red-600 font-bold"
                      onClick={() => handleDelete(p.id)}
                      disabled={loading}
                      title="Smazat platbu"
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

