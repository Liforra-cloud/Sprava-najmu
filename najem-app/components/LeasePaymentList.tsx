// components/LeasePaymentList.tsx

'use client'

import { useEffect, useState } from 'react'

type Payment = {
  id: string
  amount: number
  payment_date: string
  payment_month?: string
  note?: string
  payment_type?: string
  monthly_obligation_id?: string
  payment_breakdown?: Record<string, number>
}

type Breakdown = {
  rent: number
  water: number
  gas: number
  electricity: number
  services: number
  repair_fund: number
  custom_charges?: any
}

type Props = {
  leaseId: string
}

const now = new Date()
const THIS_MONTH = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

export default function LeasePaymentList({ leaseId }: Props) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [paymentMonth, setPaymentMonth] = useState(THIS_MONTH)
  const [note, setNote] = useState('')
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [moId, setMoId] = useState<string | undefined>(undefined)

  // 1. Načti platby
  const loadPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leases/${leaseId}/payments`)
      setPayments(await res.json())
    } catch {
      setError('Nepodařilo se načíst platby.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPayments()
  }, [leaseId])

  // 2. Načti rozpad částek pro daný měsíc
  useEffect(() => {
    if (!paymentMonth) {
      setBreakdown(null)
      return
    }
    const [year, month] = paymentMonth.split('-')
    fetch(`/api/leases/${leaseId}/monthly-obligation?year=${year}&month=${parseInt(month)}`)
      .then(r => r.json())
      .then(obligation => {
        if (obligation && !obligation.error) {
          setBreakdown({
            rent: obligation.rent,
            water: obligation.water,
            gas: obligation.gas,
            electricity: obligation.electricity,
            services: obligation.services,
            repair_fund: obligation.repair_fund,
            custom_charges: obligation.custom_charges,
          })
          setAmount(obligation.total_due.toString())
          setMoId(obligation.id)
        } else {
          setBreakdown(null)
          setAmount('')
          setMoId(undefined)
        }
      })
  }, [leaseId, paymentMonth])

  // 3. Přidání platby s breakdown
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch(`/api/leases/${leaseId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        payment_date: date,
        payment_month: paymentMonth,
        note,
        monthly_obligation_id: moId,
        payment_breakdown: breakdown,
      }),
    })
    if (!res.ok) {
      setError('Chyba při odesílání platby')
    } else {
      setAmount('')
      setDate('')
      setPaymentMonth(THIS_MONTH)
      setNote('')
      setBreakdown(null)
      setMoId(undefined)
      await loadPayments()
    }
    setLoading(false)
  }

  // 4. UI pro editaci breakdownu
  function handleBreakdownChange(key: keyof Breakdown, value: number) {
    if (!breakdown) return
    setBreakdown({ ...breakdown, [key]: value })
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold">Záznamy plateb</h3>
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
        <div className="col-span-2">
          {breakdown && (
            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded mb-2">
              {Object.entries(breakdown).map(([key, val]) => (
                key !== 'custom_charges' && (
                  <div key={key}>
                    <label className="block text-xs mb-1">{key}</label>
                    <input
                      type="number"
                      value={val}
                      onChange={e => handleBreakdownChange(key as keyof Breakdown, Number(e.target.value))}
                      className="w-full border p-1 rounded text-xs"
                    />
                  </div>
                )
              ))}
              {/* custom_charges zobrazit rozpad i zde, pokud chceš */}
            </div>
          )}
        </div>
        <div className="col-span-1">
          <label className="block mb-1 text-sm">Celková částka:</label>
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

      {/* Tabulka plateb s breakdownem */}
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
                <th className="p-2 text-left">Poznámka</th>
                <th className="p-2 text-left">Rozpad</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{new Date(p.payment_date).toLocaleDateString('cs-CZ')}</td>
                  <td className="p-2">{p.payment_month || '-'}</td>
                  <td className="p-2 text-right">{p.amount} Kč</td>
                  <td className="p-2">{p.note || '-'}</td>
                  <td className="p-2">
                    {p.payment_breakdown
                      ? Object.entries(p.payment_breakdown)
                          .filter(([key]) => key !== 'custom_charges')
                          .map(([k, v]) => `${k}: ${v} Kč`)
                          .join(', ')
                      : '-'}
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
