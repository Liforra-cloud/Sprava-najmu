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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingField, setEditingField] = useState<'name' | 'address' | 'description' | null>(null)
  const [fieldValue, setFieldValue] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase
      .from<Property>('properties')
      .select(`
        id, name, address, description, date_added,
        units (
          id, identifier, floor, disposition, area,
          occupancy_status, monthly_rent, deposit, date_added
        )
      `)
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setProp(data!)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [id])

  const fields: { label: string; key: 'name' | 'address' | 'description' }[] = [
    { label: 'Název',  key: 'name' },
    { label: 'Adresa', key: 'address' },
    { label: 'Popis',  key: 'description' },
  ]

  const startEdit = (key: 'name' | 'address' | 'description') => {
    if (!prop) return
    setEditingField(key)
    const val = prop[key]
    setFieldValue(val ?? '')
  }

  const handleSaveField = async () => {
    if (!prop || !editingField) return
    setLoading(true)
    try {
      const updates: Partial<Property> = { [editingField]: fieldValue }
      const { data, error } = await supabase
        .from<Property>('properties')
        .update(updates)
        .eq('id', prop.id)
        .single()
      if (error) setError(error.message)
      else {
        setProp(data)
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
                onChange={e => setFieldValue(e.target.value)}
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
              <span className="flex-1">{prop[key] ?? <i>—</i>}</span>
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
      {/* ... jak bylo ... */}

      <button
        onClick={() => router.push('/properties')}
        className="mt-6 bg-gray-200 px-4 py-2 rounded"
      >
        Zpět na seznam
      </button>
    </div>
  )
}
