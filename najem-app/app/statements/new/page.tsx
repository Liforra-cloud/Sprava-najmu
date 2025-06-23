// app/statements/new/page.tsx

'use client'

import { useState } from 'react'
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

export default function NewStatementPage() {
  const [unitId, setUnitId] = useState('')
  const [leaseId, setLeaseId] = useState('')
  const [from, setFrom] = useState('2024-01')
  const [to, setTo] = useState('2024-12')
  const [statementItems, setStatementItems] = useState<StatementItem[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleTableChange(items: StatementItem[]) {
    setStatementItems(items)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/statements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unit_id: unitId,
        lease_id: leaseId,
        from_month: `${from}-01`,
        to_month: `${to}-01`,
        items: statementItems,
      }),
    })
    setSaving(false)
    if (res.ok) setSuccess(true)
    else alert('Chyba při ukládání.')
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold mb-4">Nové vyúčtování</h1>
      <div className="flex gap-2">
        <input value={unitId} onChange={e => setUnitId(e.target.value)} placeholder="Unit ID" className="border p-2 rounded"/>
        <input value={leaseId} onChange={e => setLeaseId(e.target.value)} placeholder="Lease ID" className="border p-2 rounded"/>
        <input type="month" value={from} onChange={e => setFrom(e.target.value)} className="border p-2 rounded"/>
        <input type="month" value={to} onChange={e => setTo(e.target.value)} className="border p-2 rounded"/>
      </div>
      <StatementTable
        unitId={unitId}
        from={from}
        to={to}
        onChange={handleTableChange}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-green-700 text-white px-4 py-2 rounded"
      >
        {saving ? 'Ukládám...' : 'Uložit draft vyúčtování'}
      </button>
      {success && <div className="text-green-700">Uloženo!</div>}
    </div>
  )
}
