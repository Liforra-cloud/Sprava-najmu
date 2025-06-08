// app/properties/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Unit = {
  id: string
  identifier: string
  floor: number
  disposition: string
  area: number
  occupancy_status: string
  monthly_rent: number
  deposit: number
  date_added: string
}

type Property = {
  id: string
  name: string
  address: string
  description: string
  date_added: string
  units: Unit[]
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [prop, setProp] = useState<Property|null>(null)
  const [editingKey, setEditingKey] = useState<keyof Property|null>(null)
  const [draftValue, setDraftValue] = useState<string>('')

  useEffect(() => {
    fetch(`/api/properties/${id}`)
      .then(res => res.json())
      .then(setProp)
  }, [id])

  if (!prop) return <div>Načítám…</div>

  async function saveField() {
    if (!editingKey) return
    const payload = { [editingKey]: draftValue }
    const res = await fetch(`/api/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated: Property = await res.json()
    setProp(updated)
    setEditingKey(null)
  }

  function renderField<
    K extends keyof Property
  >(label: string, key: K) {
    return (
      <div className="mb-4">
        <strong>{label}: </strong>
        {editingKey === key ? (
          <>
            <input
              className="border px-2 py-1"
              value={draftValue}
              onChange={e => setDraftValue(e.target.value)}
            />
            <button
              className="ml-2 bg-blue-600 text-white px-3 py-1 rounded"
              onClick={saveField}
            >
              Uložit
            </button>
            <button
              className="ml-2 bg-gray-300 px-3 py-1 rounded"
              onClick={() => setEditingKey(null)}
            >
              Zrušit
            </button>
          </>
        ) : (
          <>
            <span>{prop[key]}</span>
            <button
              className="ml-2 text-sm text-blue-600"
              onClick={() => {
                setEditingKey(key)
                setDraftValue(String(prop[key]))
              }}
            >
              Editovat
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      <button
        className="mb-4 text-gray-600"
        onClick={() => router.push('/properties')}
      >
        ← Zpět na seznam
      </button>
      <h1 className="text-2xl font-bold mb-6">Detail nemovitosti</h1>

      {renderField('Název', 'name')}
      {renderField('Adresa', 'address')}
      {renderField('Popis', 'description')}
      {renderField('Datum zařazení', 'date_added')}

      <h2 className="text-xl font-semibold mt-8 mb-4">Jednotky</h2>
      <ul className="space-y-2">
        {prop.units.map(u => (
          <li key={u.id} className="p-4 border rounded">
            <div><strong>Číslo:</strong> {u.identifier}</div>
            <div><strong>Podlaží:</strong> {u.floor}</div>
            <div><strong>Dispozice:</strong> {u.disposition}</div>
            <div><strong>Plocha:</strong> {u.area} m²</div>
            <div><strong>Stav:</strong> {u.occupancy_status}</div>
            <div><strong>Nájem:</strong> {u.monthly_rent} Kč</div>
            <div><strong>Kauce:</strong> {u.deposit} Kč</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

