/app/units/new/page.tsx
  
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'


interface Property {
  id: string
  name: string
}

export default function NewUnitPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [formData, setFormData] = useState({
    property_id: '',
    identifier: '',
    floor: '',
    disposition: '',
    area: '',
    monthly_rent: '',
    deposit: '',
    occupancy_status: 'volné',
  })

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name')

      if (error) {
        console.error('Chyba při načítání nemovitostí:', error)
      } else {
        setProperties(data)
      }
    }

    fetchProperties()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('units').insert([
      {
        ...formData,
        floor: formData.floor ? Number(formData.floor) : null,
        area: formData.area ? Number(formData.area) : null,
        monthly_rent: formData.monthly_rent ? Number(formData.monthly_rent) : null,
        deposit: formData.deposit ? Number(formData.deposit) : null,
      }
    ])
    if (error) {
      alert('Chyba při ukládání jednotky.')
      console.error(error)
    } else {
      router.push('/properties')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Přidat novou jednotku</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Nemovitost</label>
          <select
            name="property_id"
            value={formData.property_id}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Vyber nemovitost --</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Identifikátor</label>
          <input
            type="text"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Podlaží</label>
            <input
              type="number"
              name="floor"
              value={formData.floor}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium">Dispozice</label>
            <input
              type="text"
              name="disposition"
              value={formData.disposition}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Rozloha (m²)</label>
            <input
              type="number"
              name="area"
              value={formData.area}
              onChange={handleChange}
              step="0.1"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium">Stav obsazenosti</label>
            <select
              name="occupancy_status"
              value={formData.occupancy_status}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="volné">Volné</option>
              <option value="obsazeno">Obsazeno</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Nájem (Kč)</label>
            <input
              type="number"
              name="monthly_rent"
              value={formData.monthly_rent}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium">Kauce (Kč)</label>
            <input
              type="number"
              name="deposit"
              value={formData.deposit}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Uložit jednotku
        </button>
      </form>
    </div>
  )
}

