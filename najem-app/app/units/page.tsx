// app/units/page.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid'

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

const SORTABLE_FIELDS = [
  { key: 'identifier', label: 'Označení' },
  { key: 'property', label: 'Nemovitost' }, // přidáme nový sloupec
  { key: 'monthly_rent', label: 'Nájem' },
  { key: 'floor', label: 'Patro' },
  { key: 'area', label: 'Plocha' },
  { key: 'occupancy_status', label: 'Stav' },
]

export default function UnitsPage() {
  const [list, setList] = useState<Unit[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [error, setError] = useState<string>('')
  const [stav, setStav] = useState<string>('')
  const [propertyId, setPropertyId] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [floor, setFloor] = useState<string>('')
  const [areaMin, setAreaMin] = useState<string>('')
  const [areaMax, setAreaMax] = useState<string>('')

  // Třídění
  const [orderBy, setOrderBy] = useState<string>('date_added')
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('desc')

  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/properties')
      .then(async res => {
        const json = await res.json()
        if (res.ok && Array.isArray(json)) {
          setProperties(json)
        }
      })
  }, [])

  useEffect(() => {
    let url = '/api/units?'
    const params = []
    if (stav) params.push(`stav=${encodeURIComponent(stav)}`)
    if (propertyId) params.push(`propertyId=${encodeURIComponent(propertyId)}`)
    if (search) params.push(`search=${encodeURIComponent(search)}`)
    if (floor) params.push(`floor=${encodeURIComponent(floor)}`)
    if (areaMin) params.push(`areaMin=${encodeURIComponent(areaMin)}`)
    if (areaMax) params.push(`areaMax=${encodeURIComponent(areaMax)}`)
    if (orderBy && orderBy !== "property") params.push(`orderBy=${encodeURIComponent(orderBy)}`)
    if (orderDir) params.push(`orderDir=${encodeURIComponent(orderDir)}`)
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
  }, [stav, propertyId, search, floor, areaMin, areaMax, orderBy, orderDir])

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

  // Kliknutí na hlavičku tříděného sloupce
  function handleSort(field: string) {
    if (orderBy === field) {
      setOrderDir(orderDir === 'asc' ? 'desc' : 'asc')
    } else {
      setOrderBy(field)
      setOrderDir('asc')
    }
  }

  function renderSortIcon(field: string) {
    if (orderBy !== field) return null
    return orderDir === 'asc'
      ? <ChevronUpIcon className="inline w-4 h-4 ml-1" />
      : <ChevronDownIcon className="inline w-4 h-4 ml-1" />
  }

  // Pomocná funkce pro získání názvu nemovitosti podle ID
  function getPropertyName(property_id: string) {
    return properties.find(p => p.id === property_id)?.name || '—'
  }

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
        <div>
          <label className="mr-2 font-semibold">Patro:</label>
          <input
            type="number"
            className="border px-2 py-1 rounded w-20"
            value={floor}
            onChange={e => setFloor(e.target.value)}
            placeholder="např. 2"
          />
        </div>
        <div>
          <label className="mr-2 font-semibold">Plocha:</label>
          <input
            type="number"
            className="border px-2 py-1 rounded w-20"
            value={areaMin}
            onChange={e => setAreaMin(e.target.value)}
            placeholder="od"
            min="0"
          />
          <span className="mx-1">–</span>
          <input
            type="number"
            className="border px-2 py-1 rounded w-20"
            value={areaMax}
            onChange={e => setAreaMax(e.target.value)}
            placeholder="do"
            min="0"
          />
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* TABULKA */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2">Označení</th>
              <th className="px-4 py-2">Nemovitost</th>
              {SORTABLE_FIELDS.filter(f => f.key !== 'identifier' && f.key !== 'property').map(field => (
                <th
                  key={field.key}
                  className="px-4 py-2 cursor-pointer select-none"
                  onClick={() => handleSort(field.key)}
                >
                  {field.label}
                  {renderSortIcon(field.key)}
                </th>
              ))}
              <th className="px-4 py-2">Akce</th>
            </tr>
          </thead>
          <tbody>
            {list.map(unit => (
              <tr key={unit.id} className="border-t">
                <td className="px-4 py-2">{unit.identifier}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/properties/${unit.property_id}`}
                    className="text-blue-700 underline hover:text-blue-900"
                  >
                    {getPropertyName(unit.property_id)}
                  </Link>
                </td>
                <td className="px-4 py-2">{unit.monthly_rent ?? '-'}</td>
                <td className="px-4 py-2">{unit.floor ?? '-'}</td>
                <td className="px-4 py-2">{unit.area ?? '-'}{unit.area ? ' m²' : ''}</td>
                <td className="px-4 py-2">{unit.occupancy_status ?? '-'}</td>
                <td className="px-4 py-2">
                  <Link href={`/units/${unit.id}`}>
                    <button className="bg-gray-200 text-gray-800 px-3 py-1 rounded">
                      Detail
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={SORTABLE_FIELDS.length + 2} className="px-4 py-8 text-center text-gray-400">
                  Žádné jednotky neodpovídají zadaným filtrům.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
