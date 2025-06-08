// app/properties/[id]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
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
  description: string | null
  date_added: string
  units: Unit[]
}

export default function PropertyDetailPage() {
  const { id } = useParams() ?? {}
  const router = useRouter()

  const [prop, setProp] = useState<Property | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Pro inline editaci
  const [editingField, setEditingField] = useState<keyof Property | null>(null)
  const [fieldValue, setFieldValue] = useState<string>('')

  useEffect(() => {
    if (!id) return

    const fetchProperty = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            id, name, address, description, date_added,
            units (
              id, identifier, floor, disposition, area,
              occupancy_status, monthly_rent, deposit, date_added
            )
          `)
          .eq('id', id)
          .single()

        if (error) {
          setError(error.message)
        } else {
          setProp(data as Property)
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  const startEdit = (key: keyof Property) => {
    if (!prop) return
    setEditingField(key)
    // nastavit počáteční hodnotu podle typu pole
    const val = prop[key]
    setFieldValue(val == null ? '' : String(val))
  }

  const handleSaveField = async () => {
    if (!prop || !editingField) return
    setLoading(true)
    try {
      const updates: Partial<Property> = { [editingField]: fieldValue }
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', prop.id)
        .select()
        .single()
      if (error) {
        setError(error.message)
      } else {
        setProp(data as Property)
        setEditingField(null)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Načítám...</div>
  if (error)   return <div className="text-red-600">Chyba: {error}</div>
  if (!prop)   return <div>Nemovitost nenalezena.</div>

  // Pole, která chceme editovat
  const fields: { label: string; key: keyof Property }[] = [
    { label: 'Název',      key: 'name' },
    { label: 'Adresa',     key: 'address' },
    { label: 'Popis',      key: 'description' },
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Detail nemovitosti</h1>

      {fields.map(({ label, key }) => (
        <div key={key} className="flex items-center space-x-4">
          <span className="w-32 font-semibold">{label}:</span>
          {editingField === key ? (
            <>
              <input
                className="border px-2 py-1 flex-1"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
              />
              <button
                onClick={handleSaveField}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                Uložit
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="bg-gray-300 px-3 py-1 rounded"
              >
                Zrušit
              </button>
            </>
          ) : (
            <>
              <span className="flex-1">
                {prop[key] ?? <i>—</i>}
              </span>
              <button
                onClick={() => startEdit(key)}
                className="text-blue-600 underline"
              >
                Editovat
              </button>
            </>
          )}
        </div>
      ))}

      <p>
        <span className="w-32 font-semibold inline-block">Datum zařazení:</span>
        {new Date(prop.date_added).toLocaleDateString()}
      </p>

      <h2 className="text-2xl font-semibold mt-8">Jednotky</h2>
      {prop.units.length > 0 ? (
        <ul className="space-y-4">
          {prop.units.map((u) => (
            <li key={u.id} className="p-4 border rounded">
              <p><strong>{u.identifier}</strong> (podlaží {u.floor})</p>
              <p>{u.disposition}, {u.area} m²</p>
              <p>Stav: {u.occupancy_status}</p>
              <p>Nájem: {u.monthly_rent} Kč</p>
              <p>Kauce: {u.deposit} Kč</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Žádné jednotky.</p>
      )}

      <button
        onClick={() => router.push('/properties')}
        className="mt-6 bg-gray-200 px-4 py-2 rounded"
      >
        Zpět na seznam
      </button>
    </div>
  )
}
