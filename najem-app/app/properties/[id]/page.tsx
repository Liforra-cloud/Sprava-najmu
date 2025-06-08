'use client'

import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Pencil, X } from 'lucide-react'

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
  const [editedData, setEditedData] = useState({
    name: '',
    address: '',
    description: '',
    date_added: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

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
        setEditedData({
          name: prop.name,
          address: prop.address,
          description: prop.description || '',
          date_added: prop.date_added.split('T')[0]
        })
      }
    }

    fetchProperty()
  }, [id])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData)
      })

      if (!res.ok) throw new Error('Chyba při ukládání')

      const updated = await res.json()
      setProperty({ ...property!, ...updated })
      setSaveSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      alert('Nepodařilo se uložit změnu.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!property) return <p>Načítání...</p>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold">
          {isEditing ? (
            <input
              value={editedData.name}
              onChange={(e) =>
                setEditedData((d) => ({ ...d, name: e.target.value }))
              }
              className="border px-2 py-1 rounded text-xl"
            />
          ) : (
            property.name
          )}
        </h1>
        <button
          onClick={() => {
            setIsEditing(!isEditing)
            setSaveSuccess(false)
          }}
          className="text-blue-600 hover:text-blue-800"
          title={isEditing ? 'Zrušit úpravu' : 'Upravit informace'}
        >
          {isEditing ? <X size={18} /> : <Pencil size={18} />}
        </button>
      </div>

      <div>
        <strong>Adresa:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.address}
            onChange={(e) =>
              setEditedData((d) => ({ ...d, address: e.target.value }))
            }
            className="border px-2 py-1 rounded"
          />
        ) : (
          property.address
        )}
      </div>

      <div>
        <strong>Popis:</strong>{' '}
        {isEditing ? (
          <textarea
            value={editedData.description}
            onChange={(e) =>
              setEditedData((d) => ({ ...d, description: e.target.value }))
            }
            className="border px-2 py-1 rounded w-full"
          />
        ) : (
          property.description || '—'
        )}
      </div>

      <div>
        <strong>Přidáno:</strong>{' '}
        {isEditing ? (
          <input
            type="date"
            value={editedData.date_added}
            onChange={(e) =>
              setEditedData((d) => ({ ...d, date_added: e.target.value }))
            }
            className="border px-2 py-1 rounded"
          />
        ) : (
          new Date(property.date_added).toLocaleDateString()
        )}
      </div>

      {isEditing && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-2 px-4 py-1 bg-blue-600 text-white rounded"
        >
          {isSaving ? 'Ukládám...' : 'Uložit změny'}
        </button>
      )}

      {saveSuccess && (
        <p className="text-green-600 font-medium">✅ Změny byly uloženy.</p>
      )}

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
