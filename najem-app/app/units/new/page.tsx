// app/units/new/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewUnitPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [propertyId, setPropertyId] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [floor, setFloor] = useState('')
  const [area, setArea] = useState('')
  const [disposition, setDisposition] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => setProperties(data))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId || !identifier) {
      alert('Vyber prosím nemovitost a zadej označení jednotky.')
      return
    }
    setIsSubmitting(true)

    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        property_id: propertyId,
        identifier,
        floor: floor !== '' ? Number(floor) : null,
        area: area !== '' ? Number(area) : null,
        disposition,
        description
      }),
    })

    const data = await res.json()
    if (res.ok) {
      router.push('/units')
    } else {
      alert(data.error || 'Nepodařilo se přidat jednotku.')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Přidat jednotku</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Nemovitost */}
        <div>
          <label htmlFor="property_id" className="block text-sm font-medium text-gray-700">
            Nemovitost
          </label>
          <select
            id="property_id"
            required
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          >
            <option value="">Vyberte nemovitost</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Označení jednotky */}
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
            Označení jednotky
          </label>
          <input
            id="identifier"
            type="text"
            required
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="Např. Byt 1A"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        {/* Patro */}
        <div>
          <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
            Patro
          </label>
          <input
            id="floor"
            type="number"
            value={floor}
            onChange={e => setFloor(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            placeholder="Např. 2"
          />
        </div>

        {/* Dispozice */}
        <div>
          <label htmlFor="disposition" className="block text-sm font-medium text-gray-700">
            Dispozice
          </label>
          <input
            id="disposition"
            type="text"
            value={disposition}
            onChange={e => setDisposition(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            placeholder="Např. 2+kk"
          />
        </div>

        {/* Plocha */}
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700">
            Plocha (m²)
          </label>
          <input
            id="area"
            type="number"
            step="0.01"
            value={area}
            onChange={e => setArea(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            placeholder="Např. 45.5"
          />
        </div>

        {/* Popis */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Popis (volitelný)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Např. Byt po rekonstrukci..."
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {isSubmitting ? 'Ukládám...' : 'Přidat jednotku'}
        </button>
      </form>
    </div>
  )
}

