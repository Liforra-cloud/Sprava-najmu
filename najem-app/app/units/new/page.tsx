// app/units/new/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewUnitPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [propertyId, setPropertyId] = useState('')
  const [unitName, setUnitName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Načtení seznamu nemovitostí pro select
  useEffect(() => {
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => setProperties(data))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId || !unitName) {
      alert('Vyber prosím nemovitost a zadej název jednotky.')
      return
    }
    setIsSubmitting(true)

    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ property_id: propertyId, identifier: unitName }),
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
        <div>
          <label htmlFor="unitName" className="block text-sm font-medium text-gray-700">
            Označení jednotky
          </label>
          <input
            id="unitName"
            type="text"
            required
            value={unitName}
            onChange={e => setUnitName(e.target.value)}
            placeholder="Např. Byt 1A"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
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
