// app/properties/new/page.tsx

// app/properties/new/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPropertyPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [owner, setOwner] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [totalArea, setTotalArea] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name,
        address,
        description,
        property_type: propertyType,
        owner,
        year_built: yearBuilt ? parseInt(yearBuilt) : null,
        total_area: totalArea ? parseFloat(totalArea) : null,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/properties/${data.id}`)
    } else {
      const errorData = await res.json()
      alert(errorData.error || 'Nepodařilo se přidat nemovitost.')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Přidat nemovitost</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Název
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Např. Bytový dům Praha"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Adresa
          </label>
          <input
            id="address"
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Např. Vinohradská 25, Praha"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Popis (volitelný)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Např. Dům po rekonstrukci, má 5 jednotek..."
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
            Typ nemovitosti
          </label>
          <input
            id="propertyType"
            type="text"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            placeholder="Např. bytový dům, komerční objekt"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="owner" className="block text-sm font-medium text-gray-700">
            Vlastník
          </label>
          <input
            id="owner"
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Např. Jan Novák"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700">
            Rok kolaudace
          </label>
          <input
            id="yearBuilt"
            type="number"
            value={yearBuilt}
            onChange={(e) => setYearBuilt(e.target.value)}
            min="1800"
            max={new Date().getFullYear()}
            placeholder="Např. 2012"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="totalArea" className="block text-sm font-medium text-gray-700">
            Celková plocha (m²)
          </label>
          <input
            id="totalArea"
            type="number"
            value={totalArea}
            onChange={(e) => setTotalArea(e.target.value)}
            min="0"
            step="0.01"
            placeholder="Např. 452.5"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {isSubmitting ? 'Ukládám...' : 'Přidat nemovitost'}
        </button>
      </form>
    </div>
  )
}
