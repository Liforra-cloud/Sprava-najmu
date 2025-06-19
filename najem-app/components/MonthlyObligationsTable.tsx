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
    setExpandedId(row.id)
    setEditedRow({ ...row })
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
          {data.map(row => {
            const isOverdue = new Date() > new Date(row.year, row.month - 1, 15)
            const status =
              row.paid_amount >= row.total_due
                ? '✅ Zaplaceno'
                : row.paid_amount > 0
                ? '⚠ Částečně'
                : isOverdue
                ? '📅 Po splatnosti'
                : '❌ Nezaplaceno'

            return (
              <Fragment key={row.id}>
                <tr className="hover:bg-gray-50">
                  <td className="p-2 border">{formatMonth(row.month, row.year)}</td>
                  <td className="p-2 border">{row.total_due} Kč</td>
                  <td className="p-2 border">{row.paid_amount} Kč</td>
                  <td className="p-2 border">
                    {new Date(row.year, row.month - 1, 15).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="p-2 border">{status}</td>
                  <td className="p-2 border text-center">
                    <button onClick={() => handleEdit(row)}>
                      {expandedId === row.id ? '🔼' : '🔽'}
                    </button>
                  </td>
                </tr>

                {expandedId === row.id && (
                  <tr>
                    <td colSpan={6} className="p-4 bg-gray-50">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div>
                          <strong>Označit jako</strong>
                          <div className="flex gap-2 mt-2">
                            <button
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                              onClick={() =>
                                handleChange('paid_amount', row.total_due)
                              }
                            >
                              Zaplaceno
                            </button>
                            <input
                              type="number"
                              className="w-24 border rounded p-1 text-sm"
                              placeholder="částka"
                              value={editedRow.paid_amount ?? ''}
                              onChange={e =>
                                handleChange('paid_amount', Number(e.target.value))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            className="bg-blue-600 text-white px-4 py-1 rounded"
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}


