// app/properties/[id]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Property = {
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
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!id) return
    supabase.from('properties')
      .select('id, name, address, description, date_added')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError(error?.message || 'Nemovitost nenalezena')
        } else {
          setProperty(data)
        }
      })
  }, [id])

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/properties')}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Zpět na seznam
        </button>
      </div>
    )
  }

  if (!property) {
    return <p className="p-6">Načítám…</p>
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-3xl font-bold mb-4">{property.name}</h1>
      <p className="text-gray-600 mb-2">{property.address}</p>
      {property.description && <p className="mb-4">{property.description}</p>}
      {property.date_added && (
        <p className="text-sm text-gray-500 mb-4">
          Přidáno: {new Date(property.date_added).toLocaleDateString('cs-CZ')}
        </p>
      )}
      <button
        onClick={() => router.push('/properties')}
        className="px-4 py-2 bg-gray-200 rounded"
      >
        Zpět na seznam
      </button>
    </div>
  )
}
