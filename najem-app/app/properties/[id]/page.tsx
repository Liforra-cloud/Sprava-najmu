// app/properties/[id]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Typ pro data nemovitosti
interface Property {
  id: string
  name: string
  address: string
  description?: string
  date_added?: string
}

export default function PropertyDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Stav inline editace: které pole se upravuje
  const [editingField, setEditingField] = useState<keyof Property | null>(null)
  // Lokální hodnoty pro editovaná pole
  const [values, setValues] = useState<Partial<Property>>({})

  // Načtení dat
  useEffect(() => {
    if (!id) return
    supabase
      .from('properties')
      .select('id, name, address, description, date_added')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError(error?.message || 'Nemovitost nenalezena')
        } else {
          setProperty(data)
          setValues({ name: data.name, address: data.address, description: data.description })
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  // Handlery
  const handleChange = (field: keyof Property, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }

  const saveAll = async () => {
    if (!id) return
    setError('')
    const { data, error } = await supabase
      .from('properties')
      .update({ 
        name: values.name,
        address: values.address,
        description: values.description
      })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      setError(error.message)
    } else {
      setProperty(data)
      setEditingField(null)
    }
  }

  if (loading) return <p className="p-6">Načítám…</p>
  if (error) return <p className="text-red-600 p-6">{error}</p>
  if (!property) return null

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-3xl font-bold mb-6">Detail / Editace nemovitosti</h1>

      {/* Název */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Název</label>
        {editingField === 'name' ? (
          <input
            className="w-full p-2 border rounded"
            value={values.name || ''}
            onChange={e => handleChange('name', e.target.value)}
            onBlur={() => setEditingField(null)}
            autoFocus
          />
        ) : (
          <div className="flex justify-between items-center">
            <span>{property.name}</span>
            <button onClick={() => setEditingField('name')} className="text-blue-600 ml-2">✏️</button>
          </div>
        )}
      </div>

      {/* Adresa */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Adresa</label>
        {editingField === 'address' ? (
          <input
            className="w-full p-2 border rounded"
            value={values.address || ''}
            onChange={e => handleChange('address', e.target.value)}
            onBlur={() => setEditingField(null)}
            autoFocus
          />
        ) : (
          <div className="flex justify-between items-center">
            <span>{property.address}</span>
            <button onClick={() => setEditingField('address')} className="text-blue-600 ml-2">✏️</button>
          </div>
        )}
      </div>

      {/* Popis */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Popis</label>
        {editingField === 'description' ? (
          <textarea
            className="w-full p-2 border rounded"
            rows={3}
            value={values.description || ''}
            onChange={e => handleChange('description', e.target.value)}
            onBlur={() => setEditingField(null)}
            autoFocus
          />
        ) : (
          <div className="flex justify-between items-start">
            <span>{property.description || <i>není vyplněno</i>}</span>
            <button onClick={() => setEditingField('description')} className="text-blue-600 ml-2">✏️</button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-6">
        <button onClick={saveAll} className="bg-green-600 text-white px-4 py-2 rounded">
          Uložit změny
        </button>
        <button onClick={() => router.push('/properties')} className="bg-gray-200 px-4 py-2 rounded">
          Zrušit
        </button>
      </div>
    </div>
  )
}
