// app/units/page.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Unit = {
  id: string
  property_id: string
  identifier: string
  floor?: number
  area?: number
  description?: string
  occupancy_status?: string
  monthly_rent?: number
}

type Property = {
  id: string
  name: string
}

export default function UnitsPage() {
  const [list, setList] = useState<Unit[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [error, setError] = useState<string>('')
  const [stav, setStav] = useState<string>('')
  const [propertyId, setPropertyId] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('') // Aktuální hodnota inputu
  const [search, setSearch] = useState<string>('') // Debounced hodnota
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Načtení nemovitostí do dropdownu
  useEffect(() => {
    fetch('/api/properties')
      .then(async res => {
        const json = await res.json()
        if (res.ok && Array.isArray(json)) {
          setProperties(json)
        }
      })
  }, [])

  // Načtení jednotek při změně filtru
  useEffect(() => {
    let url = '/api/units?'
    const params = []
    if (stav) params.push(`stav=${encodeURIComponent(stav)}`)
    if (propertyId) params.push(`propertyId=${encodeURIComponent(propertyId)}`)
    if (search) params.push(`search=${encodeURIComponent(search)}`)
    url += params.join('&')
    fetch(url)
      .then(async res => {
        const json = await res.json()
        if (res.ok && Array.isArray(json)) {
          setList(json)
        } else {
          throw new Error(json.error || 'Chyba při načítání jednotek')
        }
      })
      .catch(err => setError(err.message))
  }, [stav, propertyId, search])

  // Debounce logika pro vyhledávání
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(() => {
      setSearch(searchInput)
    }, 400)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [searchInput])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Jednotky</h1>
        <Link href="/units/new">
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Přidat jednotku
          </button>
        </Link>
      </div>

      {/* FILTRY */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <div>
          <label className="mr-2 font-semibold">Filtr stavu:</label>
          <select
            value={stav}
            onChange={e => setStav(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">Všechny stavy</option>
            <option value="volné">Volné</option>
            <option value="obsazené">Obsazené</option>
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Nemovitost:</label>
          <select
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">Všechny nemovitosti</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Hledat:</label>
          <input
            className="border px-2 py-1 rounded"
            type="text"
            placeholder="Zadejte hledaný text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <ul className="space-y-4">
        {list.map(unit => (
          <li
            key={unit.id}
            className="p-4 border rounded flex justify-between items-start"
          >
            <div>
              <h2 className="font-bold text-xl">{unit.identifier}</h2>
              {unit.occupancy_status && (
                <div className="text-sm text-gray-600">
                  Stav: {unit.occupancy_status}
                </div>
              )}
              {unit.floor !== undefined && unit.floor !== null && (
                <div className="text-sm text-gray-600">
                  Patro: {unit.floor}
                </div>
              )}
              {unit.area !== undefined && unit.area !== null && (
                <div className="text-sm text-gray-600">
                  Plocha: {unit.area} m²
                </div>
              )}
              {unit.monthly_rent !== undefined && unit.monthly_rent !== null && (
                <div className="text-sm text-gray-600">
                  Nájem: {unit.monthly_rent} Kč
                </div>
              )}
              {unit.description && (
                <p className="mt-2 text-gray-800">{unit.description}</p>
              )}
            </div>
            <Link href={`/units/${unit.id}`}>
              <button className="bg-gray-200 text-gray-800 px-3 py-1 rounded">
                Detail
              </button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
