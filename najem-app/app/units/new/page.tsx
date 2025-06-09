// app/units/new/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewUnitPage() {
  const router = useRouter()
  const [unitNumber, setUnitNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [area, setArea] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        unit_number: unitNumber,
        floor,
        area,
        description,
      }),
    })

    if (res.ok) {
      router.push('/units')
    } else {
      const errorData = await res.json()
      alert(errorData.error || 'Nepodařilo se přidat jednotku.')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Přidat jednotku</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
            Číslo jednotky
          </label>
          <input
            id="unit_number"
            type="text"
            required
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            placeholder="Např. 1A, 2.05, Byt 3"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
            Patro
          </label>
          <input
            id="floor"
            type="text"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="Např. 2"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700">
            Plocha (m²)
          </label>
          <input
            id="area"
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Např. 56"
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
            placeholder="Např. Byt s balkonem, nově vymalováno..."
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
