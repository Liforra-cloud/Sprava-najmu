// app/units/new/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const OCCUPANCY_STATUS = [
  { value: 'volné', label: 'Volné' },
  { value: 'obsazené', label: 'Obsazené' },
  { value: 'pronajato', label: 'Pronajato' },
]

export default function NewUnitPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [propertyId, setPropertyId] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [floor, setFloor] = useState('')
  const [disposition, setDisposition] = useState('')
  const [area, setArea] = useState('')
  const [occupancyStatus, setOccupancyStatus] = useState('volné')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Načíst properties pro select
  useEffect(() => {
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => setProperties(data))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Debug: vypiš propertyId
    console.log('propertyId:', propertyId)

    // Kontrola propertyId (musí být zvolená)
    if (!propertyId) {
      alert('Nejprve vyber nemovitost.')
      setIsSubmitting(false)
      return
    }

    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        property_id: propertyId, // POZOR: opravdu UUID!
        identifier,
        floor: floor ? Number(floor) : null,
        disposition,
        area: area ? Number(area) : null,
        occupancy_status: occupancyStatus,
        monthly_rent: monthlyRent ? Number(monthlyRent) : null,
        deposit: deposit ? Number(deposit) : null,
        description,
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
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
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
        <div>
          <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
            Patro
          </label>
          <input
            id="floor"
            type="number"
            value={floor}
            onChange={e => setFloor(e.target.value)}
            placeholder="Např. 2"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="disposition" className="block text-sm font-medium text-gray-700">
            Dispozice (např. 2+kk)
          </label>
          <input
            id="disposition"
            type="text"
            value={disposition}
            onChange={e => setDisposition(e.target.value)}
            placeholder="Např. 2+kk"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
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
            placeholder="Např. 56.2"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="occupancy_status" className="block text-sm font-medium text-gray-700">
            Stav obsazenosti
          </label>
          <select
            id="occupancy_status"
            value={occupancyStatus}
            onChange={e => setOccupancyStatus(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          >
            {OCCUPANCY_STATUS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="monthly_rent" className="block text-sm font-medium text-gray-700">
            Měsíční nájem (Kč)
          </label>
          <input
            id="monthly_rent"
            type="number"
            step="0.01"
            value={monthlyRent}
            onChange={e => setMonthlyRent(e.target.value)}
            placeholder="Např. 14500"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="deposit" className="block text-sm font-medium text-gray-700">
            Kauce (Kč)
          </label>
          <input
            id="deposit"
            type="number"
            step="0.01"
            value={deposit}
            onChange={e => setDeposit(e.target.value)}
            placeholder="Např. 20000"
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
            onChange={e => setDescription(e.target.value)}
            placeholder="Např. Byt s lodžií, nová kuchyňská linka…"
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
