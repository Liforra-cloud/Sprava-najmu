// app/properties/new/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Property = {
  id: string
  name: string
}

const occupancyOptions = [
  { value: 'volné', label: 'Volné' },
  { value: 'obsazené', label: 'Obsazené' },
  { value: 'rezervováno', label: 'Rezervováno' },
  // Přidej další možnosti pokud máš
]

export default function NewUnitPage() {
  const router = useRouter()

  // Načtení nemovitostí
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Volání api/properties - očekáváme, že vrací jen user's nemovitosti
    fetch('/api/properties', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setProperties(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  // Formulářová pole
  const [propertyId, setPropertyId] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [disposition, setDisposition] = useState('')
  const [area, setArea] = useState('')
  const [occupancyStatus, setOccupancyStatus] = useState('volné')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [deposit, setDeposit] = useState('')
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
        property_id: propertyId,
        unit_number: unitNumber,
        floor: floor !== '' ? Number(floor) : null,
        disposition,
        area: area !== '' ? Number(area) : null,
        occupancy_status: occupancyStatus,
        monthly_rent: monthlyRent !== '' ? Number(monthlyRent) : null,
        deposit: deposit !== '' ? Number(deposit) : null,
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
          <label htmlFor="property" className="block text-sm font-medium text-gray-700">
            Nemovitost
          </label>
          <select
            id="property"
            required
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            disabled={isLoading}
          >
            <option value="">Vyber nemovitost</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700">
            Označení jednotky
          </label>
          <input
            id="unitNumber"
            type="text"
            required
            value={unitNumber}
            onChange={e => setUnitNumber(e.target.value)}
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
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            placeholder="Např. 2"
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
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            placeholder="Např. 2+kk"
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
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            placeholder="Např. 45.5"
          />
        </div>

        <div>
          <label htmlFor="occupancyStatus" className="block text-sm font-medium text-gray-700">
            Stav obsazenosti
          </label>
          <select
            id="occupancyStatus"
            value={occupancyStatus}
            onChange={e => setOccupancyStatus(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          >
            {occupancyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700">
            Měsíční nájem (Kč)
          </label>
          <input
            id="monthlyRent"
            type="number"
            step="0.01"
            value={monthlyRent}
            onChange={e => setMonthlyRent(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            placeholder="Např. 12000"
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
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            placeholder="Např. 24000"
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
