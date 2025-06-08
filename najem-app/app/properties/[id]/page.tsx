'use client'

import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

interface Unit {
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

interface Property {
  id: string
  name: string
  address: string
  description: string | null
  date_added: string
  units: Unit[]
}

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params
  const [property, setProperty] = useState<Property | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedAddress, setEditedAddress] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProperty = async () => {
      const { data: prop, error } = await supabase
        .from('properties')
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
        .single<Property>()

      if (error || !prop) {
        console.error(error)
        notFound()
      } else {
        setProperty(prop)
        setEditedAddress(prop.address)
      }
    }

    fetchProperty()
  }, [id])

  const handleSave = async () => {
    setIsSaving(true)
    const res = await fetch(`/api/properties/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address: editedAddress })
    })

    if (res.ok) {
      const updated = await res.json()
      setProperty({ ...property!, address: updated.address })
      setIsEditing(false)
    }

    setIsSaving(false)
  }

  if (!property) return <p>Načítání...</p>

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">{property.name}</h1>

      <div>
        <strong>Adresa:</strong>{' '}
        {isEditing ? (
          <input
            value={editedAddress}
            onChange={(e) => setEditedAddress(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        ) : (
          <span>{property.address}</span>
        )}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="ml-2 text-blue-600 underline"
        >
          {isEditing ? 'Zrušit' : 'Editovat'}
        </button>
      </div>

      {isEditing && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-2 px-4 py-1 bg-blue-600 text-white rounded"
        >
          {isSaving ? 'Ukládání...' : 'Uložit'}
        </button>
      )}

      <p><strong>Popis:</strong> {property.description || '—'}</p>
      <p><strong>Přidáno:</strong> {new Date(property.date_added).toLocaleDateString()}</p>

      <h2 className="text-2xl font-semibold mt-4">Jednotky</h2>
      <ul className="space-y-2">
        {property.units?.map((unit: Unit) => (
          <li key={unit.id} className="border p-4 rounded">
            <p><strong>Identifikátor:</strong> {unit.identifier}</p>
            <p><strong>Podlaží:</strong> {unit.floor}</p>
            <p><strong>Dispozice:</strong> {unit.disposition}</p>
            <p><strong>Rozloha:</strong> {unit.area} m²</p>
            <p><strong>Stav obsazenosti:</strong> {unit.occupancy_status}</p>
            <p><strong>Nájem:</strong> {unit.monthly_rent} Kč</p>
            <p><strong>Kauce:</strong> {unit.deposit} Kč</p>
            <p><strong>Přidáno:</strong> {new Date(unit.date_added).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
