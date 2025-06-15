///components/MonthlyObligationsTable.tsx

'use client'

import { useEffect, useState } from 'react'

type MonthlyObligation = {
  id: string
  year: number
  month: number
  total_due: number
  paid_amount: number
  debt: number
}

type Props = {
  leaseId: string
}

export default function MonthlyObligationsTable({ leaseId }: Props) {
  const [data, setData] = useState<MonthlyObligation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leases/${leaseId}/monthly-obligations`)
      .then(res => res.json())
      .then(setData)
      .catch(() => setError('Nepodařilo se načíst měsíční povinnosti'))
      .finally(() => setLoading(false))
  }, [leaseId])

  // EDIT funkce: pro jednoduchost inline edit jen paid_amount
  const handleEdit = async (id: string, paidAmount: number) => {
    await fetch(`/api/monthly-obligations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid_amount: paidAmount })
    })
    setData(data => data.map(row => row.id === id ? { ...row, paid_amount: paidAmount, debt: row.total_due - paidAmount } : row))
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
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id}>
              <td>{String(row.month).padStart(2, '0')}/{row.year}</td>
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
                {/* Sem můžeš přidat detail plateb pro měsíc, napárovat platby atd. */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
