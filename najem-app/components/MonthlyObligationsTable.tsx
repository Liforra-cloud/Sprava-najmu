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
  debt: number
  note: string | null
  updated_at: string | null  // ← Přidat toto
  created_at?: string        // ← Můžeš přidat volitelně i created_at
  custom_charges: CustomCharge[]
  charge_flags: Record<string, boolean>
}

type Props = {
  leaseId: string
}

const chargeKeys = [
  { key: 'rent', flagKey: 'rent_amount', label: 'Nájem' },
  { key: 'water', flagKey: 'monthly_water', label: 'Voda' },
  { key: 'gas', flagKey: 'monthly_gas', label: 'Plyn' },
  { key: 'electricity', flagKey: 'monthly_electricity', label: 'Elektřina' },
  { key: 'services', flagKey: 'monthly_services', label: 'Služby' },
  { key: 'repair_fund', flagKey: 'repair_fund', label: 'Fond oprav' }
]

export default function MonthlyObligationsTable({ leaseId }: Props) {
  const [data, setData] = useState<ObligationRow[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editedRow, setEditedRow] = useState<Partial<ObligationRow>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchObligations = async () => {
      const { data, error } = await supabase
        .from('monthly_obligations')
        .select('*')
        .eq('lease_id', leaseId)
        .order('year', { ascending: true })
        .order('month', { ascending: true })

      if (!error && data) setData(data as ObligationRow[])
    }

    fetchObligations()
  }, [leaseId])

  const handleEdit = (row: ObligationRow) => {
    setExpandedId(prev => (prev === row.id ? null : row.id))
    setEditedRow({ ...row })
  }

  const handleChange = (key: keyof ObligationRow | `charge_flags.${string}`, value: unknown) => {
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
      setEditedRow(prev => ({ ...prev, [key]: value }))
    }
  }

  const calculateTotalDue = (row: Partial<ObligationRow>) => {
    const flags = row.charge_flags ?? {}
    const sum = chargeKeys.reduce((total, { key, flagKey }) => {
      if (flags[flagKey]) {
        total += Number((row[key as keyof ObligationRow]) ?? 0)
      }
      return total
    }, 0)
    const custom = (row.custom_charges ?? []).filter(c => c.enabled).reduce((t, c) => t + c.amount, 0)
    return sum + custom
  }

  const saveChanges = async (id: string) => {
    setSaving(true)
    const total_due = calculateTotalDue(editedRow)
    const update = {
      ...editedRow,
      total_due,
      charge_flags: editedRow.charge_flags ?? {},
      custom_charges: editedRow.custom_charges ?? [],
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('monthly_obligations').update(update).eq('id', id)
    if (!error) {
      setData(prev => prev.map(row => row.id === id ? { ...row, ...update } as ObligationRow : row))
      setExpandedId(null)
      setEditedRow({})
    } else {
      console.error('Chyba při ukládání:', error)
    }
    setSaving(false)
  }

  const setPaymentAmount = async (id: string, amount: number) => {
    const row = data.find(r => r.id === id)
    if (!row) return
    const update: ObligationRow = {
      ...row,
      paid_amount: amount,
      updated_at: new Date().toISOString(),
    }
    const total_due = calculateTotalDue(update)

    const { error } = await supabase
      .from('monthly_obligations')
      .update({ ...update, total_due })
      .eq('id', id)

    if (!error) {
      setData(prev => prev.map(r => r.id === id ? { ...update, total_due } : r))
    } else {
      console.error('Chyba při změně částky:', error)
    }
  }

  const getStatus = (due: number, paid: number, year: number, month: number) => {
    const now = new Date()
    const dueDate = new Date(year, month - 1, 15)
    if (paid > due) return `☑ Přeplatek (${(paid - due).toFixed(2)} Kč)`
    if (paid === due) return '✅ Zaplaceno'
    if (paid > 0) return '⚠ Částečně zaplaceno'
    if (now > dueDate) return '🔴 Po splatnosti'
    return '❌ Nezaplaceno'
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
            <th className="p-2 border">Akce</th>
            <th className="p-2 border">Detail</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <Fragment key={row.id}>
              <tr className="hover:bg-gray-50">
                <td className="p-2 border">{`${String(row.month).padStart(2, '0')}/${row.year}`}</td>
                <td className="p-2 border">{row.total_due} Kč</td>
                <td className="p-2 border">
                  <div className="flex justify-between items-center">
                    <span>{row.paid_amount} Kč</span>
                    <button
                      className="ml-2 text-blue-600"
                      title="Upravit částku"
                      onClick={() => {
                        const vstup = prompt('Zadej zaplacenou částku:', row.paid_amount.toString())
                        const amount = parseFloat(vstup ?? '')
                        if (!isNaN(amount)) setPaymentAmount(row.id, amount)
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                </td>
                <td className="p-2 border">{new Date(row.year, row.month - 1, 15).toLocaleDateString('cs-CZ')}</td>
                <td className="p-2 border">{getStatus(row.total_due, row.paid_amount, row.year, row.month)}</td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => setPaymentAmount(row.id, row.total_due)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Zaplaceno
                  </button>
                </td>
                <td className="p-2 border text-center">
                  <button onClick={() => handleEdit(row)}>
                    {expandedId === row.id ? '🔼' : '🔽'}
                  </button>
                </td>
              </tr>

              {expandedId === row.id && (
                <tr>
                  <td colSpan={7} className="bg-gray-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <strong>Rozpis poplatků</strong>
                        <table className="mt-2 w-full text-sm">
                          <tbody>
                            {chargeKeys.map(({ key, flagKey, label }) => (
                              <tr key={key}>
                                <td>{label}</td>
                                <td>
                                  <input
                                    type="number"
                                    className="border w-20 rounded p-1"
                                    value={editedRow[key] ?? ''}
                                    onChange={e => handleChange(key, Number(e.target.value))}
                                  /> Kč
                                </td>
                                <td>
                                  <label className="ml-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={editedRow.charge_flags?.[flagKey] ?? false}
                                      onChange={e => handleChange(`charge_flags.${flagKey}`, e.target.checked)}
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
                                      const updated = [...(editedRow.custom_charges ?? [])]
                                      updated[i] = { ...updated[i], amount: Number(e.target.value) }
                                      setEditedRow(prev => ({ ...prev, custom_charges: updated }))
                                    }}
                                  /> Kč
                                </td>
                                <td>
                                  <label className="ml-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={item.enabled}
                                      onChange={e => {
                                        const updated = [...(editedRow.custom_charges ?? [])]
                                        updated[i] = { ...updated[i], enabled: e.target.checked }
                                        setEditedRow(prev => ({ ...prev, custom_charges: updated }))
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
                              onChange={e => handleChange('note', e.target.value)}
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


