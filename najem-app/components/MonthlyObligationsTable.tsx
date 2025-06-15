///components/MonthlyObligationsTable.tsx

'use client'

import { useEffect, useState } from 'react'

type Payment = {
  id: string
  amount: number
  payment_date: string
  note?: string
}

type CustomCharge = { name: string; amount: number; enabled: boolean }
type ChargeFlags = Record<string, boolean>

type MonthlyObligation = {
  id: string
  year: number
  month: number
  total_due: number
  paid_amount: number
  debt: number
  payments: Payment[]
  rent: number
  water: number
  gas: number
  electricity: number
  services: number
  repair_fund: number
  custom_charges: CustomCharge[]
  charge_flags: ChargeFlags
}

type Props = {
  leaseId: string
}

export default function MonthlyObligationsTable({ leaseId }: Props) {
  const [data, setData] = useState<MonthlyObligation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

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

  // Editace jednotlivých hodnot v rozpadu
  const handleEdit = async (
    id: string,
    key: string,
    value: any,
    customChargeIndex?: number
  ) => {
    let body: any
    if (key === 'custom_charges' && typeof customChargeIndex === 'number') {
      // edit konkrétního vlastního poplatku
      const original = data.find(row => row.id === id)
      if (!original) return
      const updated = [...original.custom_charges]
      updated[customChargeIndex] = value
      body = { custom_charges: updated }
    } else if (key.startsWith('charge_flags.')) {
      // úprava účtování
      const field = key.split('.')[1]
      const original = data.find(row => row.id === id)
      if (!original) return
      body = {
        charge_flags: {
          ...original.charge_flags,
          [field]: value,
        },
      }
    } else {
      body = { [key]: value }
    }
    await fetch(`/api/monthly-obligations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    // Refresh data (zjednodušeně, reálně lépe udělat optimistic update)
    setData(data => data.map(row => {
      if (row.id !== id) return row
      if (key === 'custom_charges' && typeof customChargeIndex === 'number') {
        const updated = [...row.custom_charges]
        updated[customChargeIndex] = value
        return { ...row, custom_charges: updated }
      }
      if (key.startsWith('charge_flags.')) {
        const field = key.split('.')[1]
        return {
          ...row,
          charge_flags: { ...row.charge_flags, [field]: value }
        }
      }
      return { ...row, [key]: value }
    }))
  }

  // Přidání platby k měsíci
  const handleAddPayment = async (monthId: string, amount: number) => {
    await fetch(`/api/monthly-obligations/${monthId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    })
    // Reload payments for the given month
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
            <Fragment key={row.id}>
              <tr>
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
                    onChange={e => handleEdit(row.id, 'paid_amount', Number(e.target.value))}
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
                    <div className="flex flex-wrap gap-8 items-start">
                      <div>
                        <strong>Rozpad poplatků:</strong>
                        <table className="text-xs">
                          <tbody>
                            {[
                              ["Nájem", "rent", row.rent, row.charge_flags.rent_amount],
                              ["Voda", "water", row.water, row.charge_flags.monthly_water],
                              ["Plyn", "gas", row.gas, row.charge_flags.monthly_gas],
                              ["Elektřina", "electricity", row.electricity, row.charge_flags.monthly_electricity],
                              ["Služby", "services", row.services, row.charge_flags.monthly_services],
                              ["Fond oprav", "repair_fund", row.repair_fund, row.charge_flags.repair_fund]
                            ].map(([label, key, amount, flag]) => (
                              <tr key={key as string}>
                                <td>{label}</td>
                                <td>
                                  <input
                                    type="number"
                                    value={amount as number}
                                    min={0}
                                    onChange={e => handleEdit(row.id, key as string, Number(e.target.value))}
                                    className="border w-16 rounded p-1"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={!!flag}
                                    onChange={e => handleEdit(row.id, `charge_flags.${key}`, e.target.checked)}
                                  /> Účtovat
                                </td>
                              </tr>
                            ))}
                            {/* Vlastní poplatky */}
                            {row.custom_charges?.map((cc, idx) => (
                              <tr key={"cc" + idx}>
                                <td>{cc.name}</td>
                                <td>
                                  <input
                                    type="number"
                                    value={cc.amount}
                                    min={0}
                                    onChange={e => handleEdit(row.id, 'custom_charges', { ...cc, amount: Number(e.target.value) }, idx)}
                                    className="border w-16 rounded p-1"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={!!cc.enabled}
                                    onChange={e => handleEdit(row.id, 'custom_charges', { ...cc, enabled: e.target.checked }, idx)}
                                  /> Účtovat
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div>
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
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { Fragment } from 'react'

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

