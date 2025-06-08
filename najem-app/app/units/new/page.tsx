'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface Property {
  id: string
  name: string
}

export default function NewUnitPage() {
  const [identifier, setIdentifier] = useState('')
  const [floor, setFloor] = useState<number | null>(null)
  const [disposition, setDisposition] = useState('')
  const [area, setArea] = useState<number | null>(null)
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null)
  const [deposit, setDeposit] = useState<number | null>(null)
  const [propertyId, setPropertyId] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('id, name')
      if (error) {
        console.error('Chyba při načítání nemovitostí:', error)
      } else {
        setProperties(data || [])
        if (data && data.length > 0) setPropertyId(data[0].id)
      }
    }
    fetchProperties()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.from('units').insert([
      {
        property_id: propertyId,
        identifier,
        floor,
        disposition,
        area,
        monthly_rent: monthlyRent,
        deposit
      }
    ])

    if (error) {
      console.error('Chyba při ukládání jednotky:', error)
      alert('Nepodařilo se přidat jednotku.')
    } else {
      router.push('/units')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Přidat jednotku</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Nemovitost</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Identifikátor</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="např. Byt 3A"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Podlaží</label>
          <input
            type="number"
            value={floor ?? ''}
            onChange={(e) => setFloor(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="např. 2"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Dispozice</label>
          <input
            type="text"
            value={disposition}
            onChange={(e) => setDisposition(e.target.value)}
            placeholder="např. 2+kk"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Výmera (m²)</label>
          <input
            type="number"
            step="0.1"
            value={area ?? ''}
            onChange={(e) => setArea(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="např. 45.5"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Nájem (Kč)</label>
          <input
            type="number"
            step="0.01"
            value={monthlyRent ?? ''}
            onChange={(e) => setMonthlyRent(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="např. 12500"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Kauce (Kč)</label>
          <input
            type="number"
            step="0.01"
            value={deposit ?? ''}
            onChange={(e) => setDeposit(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="např. 25000"
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Uložit jednotku
        </button>
      </form>
    </div>
  )
}
