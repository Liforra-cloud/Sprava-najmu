///components/MonthlyObligationsTable.tsx

'use client'

import { useEffect, useState } from 'react'

type Payment = {
  id: string
  amount: number
  payment_date: string
  note?: string
}

type MonthlyObligation = {
  id: string
  year: number
  month: number
  total_due: number
  paid_amount: number
  debt: number
  payments: Payment[] // předpokládáme, že v API bude pole payments (pokud ne, upravíme)
}

type Props = {
  leaseId: string
}

export default function MonthlyObligationsTable({ leaseId }: Props) {
  const [data, setData] = useState<MonthlyObligation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null) // Pro rozklik detailu

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leases/${leaseId}/monthly-obligations`)
      .then(res => res.json())
      .then(async obligations => {
        // Pro každý měsíc stáhneme platby (pokud payments nejsou rovnou v API)
        const withPayments = await Promise.all(
          obligations.map(async (o: MonthlyObligation) => {
            const res = await fetch(`/api/monthly-obligations/${o.id}/payments`)
            const payments = res.ok ? await res.json() : []
            return { ...o, payments }
          })
        )
        setData(withPayments)
      })
      .catch(() => setError('Nepodařilo se načíst měsíční povinnosti'))
      .finally(() => setLoading(false))
  }, [leaseId])

  // Inline editace zaplacené částky
  const handleEdit = async (id: string, paidAmount: number) => {
    await fetch(`/api/monthly-obligations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid_amount: paidAmount })
    })
    setData(data => data.map(row => row.id === id ? { ...row, paid_amount: paidAmount, debt: row.total_due - paidAmount } : row))
  }

  // Přidání platby k měsíci
  const handleAddPayment = async (monthId: string, amount: number) => {
    await fetch(`/api/monthly-obligations/${monthId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    })
    // Reload
    const res = await fetch(`/api/monthly-obligations/${monthId}/payments`)
    const payments = res.ok ? await res.json() : []
    setData(data => data.map(row => row.id === monthId ? { ...row, payments } : row))
  }

  if (loading) return <p>Načítám...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Měsíční povinnosti</h2>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th>Měsíc</th>
            <th>Mělo být zaplaceno</th>
            <th>Je zaplaceno</th>
            <th>Stav</th>
            <th>Platby</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <>
              <tr key={row.id}>
                <td>
                  <button
                    onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                    className="underline text-blue-700"
                  >
                    {String(row.month).padStart(2, '0')}/{row.year}
                  </button>
                </td>
                <td>{row.total_due} Kč</td>
                <td>
                  <input
                    type="number"
                    value={row.paid_amount}
                    min={0}
                    onChange={e => handleEdit(row.id, Number(e.target.value))}
                    className="border rounded p-1 w-20"
                  />
                </td>
                <td>
                  {row.debt > 0 ? (
                    <span className="text-red-600">Nedoplatek {row.debt} Kč</span>
                  ) : row.debt < 0 ? (
                    <span className="text-green-600">Přeplatek {-row.debt} Kč</span>
                  ) : (
                    <span className="text-green-600">Zaplaceno</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                    className="text-xs underline"
                  >
                    {expanded === row.id ? "Skrýt" : "Zobrazit"}
                  </button>
                </td>
              </tr>
              {expanded === row.id && (
                <tr>
                  <td colSpan={5} className="bg-gray-50 p-2">
                    <strong>Platby za měsíc:</strong>
                    <ul className="pl-4 list-disc">
                      {row.payments && row.payments.length > 0 ? (
                        row.payments.map(p => (
                          <li key={p.id}>
                            {new Date(p.payment_date).toLocaleDateString('cs-CZ')}: {p.amount} Kč
                            {p.note && <> – {p.note}</>}
                          </li>
                        ))
                      ) : (
                        <li>Žádné platby</li>
                      )}
                    </ul>
                    <AddPaymentForm onAdd={amount => handleAddPayment(row.id, amount)} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Malý formulář na přidání platby k měsíci
function AddPaymentForm({ onAdd }: { onAdd: (amount: number) => void }) {
  const [amount, setAmount] = useState(0)
  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        if (amount > 0) onAdd(amount)
        setAmount(0)
      }}
      className="mt-2 flex gap-2"
    >
      <input
        type="number"
        value={amount}
        min={0}
        onChange={e => setAmount(Number(e.target.value))}
        placeholder="Přidat platbu"
        className="border rounded p-1 w-24"
      />
      <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded">Přidat</button>
    </form>
  )
}
