// app/properties/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Unit = {
  id: string
  identifier: string
  floor: number
  disposition: string
  area: number
  occupancy_status: 'volné' | 'obsazené' | 'rezervace'
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
  const router = useRouter()
  const { id } = useParams()

  const [prop, setProp] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<Exclude<keyof Property, 'units'> | null>(null)
  const [draftValue, setDraftValue] = useState<string>('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase
      .from<Property>('properties')
      .select(`
        id,
        name,
        address,
        description,
        date_added,
        units (
          id,
          identifier,
          floor,
          disposition,
          area,
          occupancy_status,
          monthly_rent,
          deposit,
          date_added
        )
      `)
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setProp(data)
      })
      .finally(() => setLoading(false))
  }, [id])

  const saveField = async (key: Exclude<keyof Property, 'units'>) => {
    if (!prop) return
    setLoading(true)
    const updates = { [key]: draftValue }
    const { error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', prop.id)
    if (error) setError(error.message)
    else setProp({ ...prop, [key]: draftValue })
    setEditingKey(null)
    setLoading(false)
  }

  function renderField<K extends Exclude<keyof Property, 'units'>>(
    label: string,
    key: K
  ) {
    if (!prop) return null
    return (
      <div className="mb-4">
        <strong>{label}: </strong>
        {editingKey === key ? (
          <>
            <input
              className="border px-2 py-1 rounded mr-2"
              value={draftValue}
              onChange={e => setDraftValue(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-4 py-1 rounded mr-2"
              onClick={() => saveField(key)}
              disabled={loading}
            >
              Uložit
            </button>
            <button
              className="bg-gray-200 px-4 py-1 rounded"
              onClick={() => setEditingKey(null)}
              disabled={loading}
            >
              Zrušit
            </button>
          </>
        ) : (
          <>
            <span>{String(prop[key])}</span>
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

  if (loading) return <div className="p-6">Načítání...</div>
  if (error) return <div className="p-6 text-red-600">Chyba: {error}</div>
  if (!prop) return <div className="p-6">Nemovitost nenalezena.</div>

  return (
    <div className="p-6">
      <button
        className="mb-4 text-sm text-gray-600"
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
            <strong>{u.identifier}</strong> — {u.disposition}, {u.area} m²,{' '}
            {u.occupancy_status}, nájem {u.monthly_rent} Kč, kauce {u.deposit} Kč
          </li>
        ))}
      </ul>
    </div>
  )
}
