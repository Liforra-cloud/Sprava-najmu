// app/statements/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import StatementTable from '@/components/StatementTable'

type StatementItem = {
  name: string;
  item_type?: string;
  totalAdvance: number;
  consumption: number | '';
  unit: string;
  totalCost: number | '';
  diff: number;
  note?: string;
};

export default function StatementDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [statement, setStatement] = useState<any>(null)
  const [items, setItems] = useState<StatementItem[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/statements/${id}`)
      .then(res => res.json())
      .then(data => {
        setStatement(data)
        setItems(data.statement_items || [])
      })
  }, [id])

  function handleTableChange(newItems: StatementItem[]) {
    setItems(newItems)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/statements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: statement.status,
        items,
      }),
    })
    setSaving(false)
    if (res.ok) setSuccess(true)
    else alert('Chyba při ukládání.')
  }

  if (!statement) return <div>Načítám...</div>

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold mb-4">Detail vyúčtování</h1>
      <div>Jednotka: {statement.unit_id} | Období: {statement.from_month} – {statement.to_month} | Stav: {statement.status}</div>
      <StatementTable
        unitId={statement.unit_id}
        from={statement.from_month.slice(0,7)}
        to={statement.to_month.slice(0,7)}
        initialItems={items}
        onChange={handleTableChange}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-green-700 text-white px-4 py-2 rounded"
      >
        {saving ? 'Ukládám...' : 'Uložit změny'}
      </button>
      {success && <div className="text-green-700">Uloženo!</div>}
    </div>
  )
}
