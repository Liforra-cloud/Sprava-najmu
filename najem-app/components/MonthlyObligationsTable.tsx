///components/MonthlyObligationsTable.tsx

'use client'

import { useEffect, useState, Fragment } from 'react'
import { supabase } from '@/lib/supabaseClient'

type CustomCharge = { name: string; amount: number; enabled: boolean }

type ObligationRow = {
  id: string
  year: number
  month: number
  rent: number
  water: number
  gas: number
  electricity: number
  services: number
  repair_fund: number
  total_due: number
  paid_amount: number
  note: string | null
  custom_charges: CustomCharge[]
  charge_flags: Record<string, boolean>
}

type Props = {
  leaseId: string
}

const chargeKeys: (keyof Pick<
  ObligationRow,
  'rent' | 'water' | 'gas' | 'electricity' | 'services' | 'repair_fund'
>)[] = ['rent', 'water', 'gas', 'electricity', 'services', 'repair_fund']

const labels: Record<string, string> = {
  rent: 'Nájem',
  water: 'Voda',
  gas: 'Plyn',
  electricity: 'Elektřina',
  services: 'Služby',
  repair_fund: 'Fond oprav',
}

export default function MonthlyObligationsTable({ leaseId }: Props) {
  const [data, setData] = useState<ObligationRow[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editedRow, setEditedRow] = useState<Partial<ObligationRow>>({})
  const [saving, setSaving] = useState(false)
  const [editingPayment, setEditingPayment] = useState<string | null>(null)

  useEffect(() => {
    const fetchObligations = async () => {
      const { data, error } = await supabase
        .from('monthly_obligations')
        .select('*')
        .eq('lease_id', leaseId)
        .order('year', { ascending: true })
        .order('month', { ascending: true })

      if (error) {
        console.error(error)
        return
      }
      setData(data as ObligationRow[])
    }

    fetchObligations()
  }, [leaseId])

  const handleEdit = (row: ObligationRow) => {
    if (expandedId === row.id) {
      setExpandedId(null)
      setEditedRow({})
    } else {
      setExpandedId(row.id)
      setEditedRow({ ...row })
    }
  }

  const handleChange = (
    key: keyof ObligationRow | `charge_flags.${string}`,
    value: unknown
  ) => {
    if (key.startsWith('charge_flags.')) {
      const flagKey = key.split('.')[1]
      setEditedRow(prev => ({
        ...prev,
        charge_flags: {
          ...prev.charge_flags,
          [flagKey]: value as boolean,
        },
      }))
    } else {
      setEditedRow(prev => ({
        ...prev,
        [key]: value,
      }))
    }
  }

  const calculateTotalDue = (row: Partial<ObligationRow>): number => {
    const flags = row.charge_flags ?? {}
    const baseSum = chargeKeys.reduce((sum, key) => {
      if (flags[key]) {
        sum += row[key] ?? 0
      }
      return sum
    }, 0)

    const customSum = (row.custom_charges ?? [])
      .filter(c => c.enabled)
      .reduce((sum, c) => sum + c.amount, 0)

    return baseSum + customSum
  }

  const saveChanges = async (id: string) => {
    setSaving(true)
    const total_due = calculateTotalDue(editedRow)

    const { error } = await supabase
      .from('monthly_obligations')
      .update({
        ...editedRow,
        total_due,
        charge_flags: editedRow.charge_flags ?? {},
        custom_charges: editedRow.custom_charges ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Chyba při ukládání:', error)
    } else {
      setData(prev =>
        prev.map(row =>
          row.id === id ? { ...row, ...editedRow, total_due } as ObligationRow : row
        )
      )
      setExpandedId(null)
      setEditedRow({})
    }

    setSaving(false)
  }

  const formatMonth = (month: number, year: number) =>
    `${String(month).padStart(2, '0')}/${year}`

  const getStatus = (due: number, paid: number, year: number, month: number) => {
    const now = new Date()
    const dueDate = new Date(year, month - 1, 15)
    if (paid > due) return `✅ Přeplatek ${paid - due} Kč`
    if (paid === due) return '✅ Zaplaceno'
    if (paid > 0 && paid < due) return '⚠ Částečně'
    if (now > dueDate) return '🔴 Po splatnosti'
    return '❌ Nezaplaceno'
  }

  const setPaymentAmount = async (id: string, amount: number) => {
    const row = data.find(r => r.id === id)
    if (!row) return
    const updatedRow = { ...row, paid_amount: amount }
    await supabase
      .from('monthly_obligations')
      .update({ paid_amount: amount, updated_at: new Date().toISOString() })
      .eq('id', id)
    setData(prev =>
      prev.map(r => (r.id === id ? { ...r, paid_amount: amount } : r))
    )
    setEditingPayment(null)
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Měsíc</th>
            <th className="p-2 border">Předpis</th>
            <th className="p-2 border">Zaplaceno</th>
            <th className="p-2 border">Splatnost</th>
            <th className="p-2 border">Stav</th>
            <th className="p-2 border">Detail</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <Fragment key={row.id}>
              <tr className="hover:bg-gray-50">
                <td className="p-2 border">{formatMonth(row.month, row.year)}</td>
                <td className="p-2 border">{row.total_due} Kč</td>
                <td className="p-2 border text-right">
                  {editingPayment === row.id ? (
                    <input
                      type="number"
                      className="w-20 border rounded p-1"
                      autoFocus
                      defaultValue={row.paid_amount}
                      onBlur={e => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val)) setPaymentAmount(row.id, val)
                      }}
                    />
                  ) : (
                    <>
                      {row.paid_amount} Kč{' '}
                      <button onClick={() => setEditingPayment(row.id)}>✏️</button>
                    </>
                  )}
                </td>
                <td className="p-2 border">
                  {new Date(row.year, row.month - 1, 15).toLocaleDateString('cs-CZ')}
                </td>
                <td className="p-2 border">
                  {getStatus(row.total_due, row.paid_amount, row.year, row.month)}
                </td>
                <td className="p-2 border text-center">
                  <button onClick={() => handleEdit(row)}>
                    {expandedId === row.id ? '🔼' : '🔽'}
                  </button>
                </td>
              </tr>

              {expandedId === row.id && (
                <tr>
                  <td colSpan={6} className="p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <strong>Rozpis poplatků</strong>
                        <table className="mt-2 w-full text-sm">
                          <tbody>
                            {chargeKeys.map(key => (
                              <tr key={key}>
                                <td>{labels[key]}</td>
                                <td>
                                  <input
                                    type="number"
                                    className="border w-20 rounded p-1"
                                    value={editedRow[key] ?? ''}
                                    onChange={e =>
                                      handleChange(key, Number(e.target.value))
                                    }
                                  /> Kč
                                </td>
                                <td>
                                  <label className="ml-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={editedRow.charge_flags?.[key] ?? false}
                                      onChange={e =>
                                        handleChange(`charge_flags.${key}`, e.target.checked)
                                      }
                                    /> Účtovat
                                  </label>
                                </td>
                              </tr>
                            ))}

                            {(editedRow.custom_charges ?? []).map((item, i) => (
                              <tr key={i}>
                                <td>{item.name}</td>
                                <td>
                                  <input
                                    type="number"
                                    className="border w-20 rounded p-1"
                                    value={item.amount}
                                    onChange={e => {
                                      const newVal = Number(e.target.value)
                                      setEditedRow(prev => {
                                        const updated = [...(prev.custom_charges ?? [])]
                                        updated[i] = {
                                          ...updated[i],
                                          amount: newVal,
                                        }
                                        return { ...prev, custom_charges: updated }
                                      })
                                    }}
                                  /> Kč
                                </td>
                                <td>
                                  <label className="ml-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={item.enabled}
                                      onChange={e => {
                                        const checked = e.target.checked
                                        setEditedRow(prev => {
                                          const updated = [...(prev.custom_charges ?? [])]
                                          updated[i] = {
                                            ...updated[i],
                                            enabled: checked,
                                          }
                                          return { ...prev, custom_charges: updated }
                                        })
                                      }}
                                    /> Účtovat
                                  </label>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <strong>Ostatní</strong>
                        <div className="mt-2">
                          <label>
                            <span>Poznámka:</span>
                            <textarea
                              className="w-full border rounded p-1 mt-1"
                              value={editedRow.note ?? ''}
                              onChange={e =>
                                handleChange('note', e.target.value)
                              }
                            />
                          </label>
                        </div>

                        <button
                          className="mt-4 bg-blue-600 text-white px-4 py-1 rounded"
                          onClick={() => saveChanges(row.id)}
                          disabled={saving}
                        >
                          {saving ? 'Ukládám...' : 'Uložit změny'}
                        </button>
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

