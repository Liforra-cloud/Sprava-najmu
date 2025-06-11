// app/properties/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Property = {
  id: string
  name: string
  address: string
  description?: string
  unitCount?: number
  occupiedCount?: number
  totalRent?: number
  hasNote?: boolean
  hasAttachment?: boolean
}

type SortKey = 'name' | 'unitCount' | 'totalRent'
type SortDirection = 'asc' | 'desc'

export default function PropertiesPage() {
  const [list, setList] = useState<Property[]>([])
  const [search, setSearch] = useState('')
  const [minUnits, setMinUnits] = useState('')
  const [minRent, setMinRent] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetch('/api/properties')
      .then(async res => {
        const json = await res.json()
        if (res.ok && Array.isArray(json)) {
          setList(json)
        } else {
          throw new Error(json.error || 'Chyba při načítání')
        }
      })
      .catch(err => setError(err.message))
  }, [])

  // Filtrování a řazení
  let filtered = list
    .filter(
      prop =>
        prop.name.toLowerCase().includes(search.toLowerCase()) ||
        prop.address.toLowerCase().includes(search.toLowerCase())
    )
    .filter(prop =>
      minUnits ? (prop.unitCount || 0) >= Number(minUnits) : true
    )
    .filter(prop =>
      minRent ? (prop.totalRent || 0) >= Number(minRent) : true
    )

  filtered = filtered.sort((a, b) => {
    const aVal: string | number = a[sortKey] ?? ''
    const bVal: string | number = b[sortKey] ?? ''
    // Pokud je string (název), řadíme podle localeCompare
    if (sortKey === 'name') {
      const cmp = (aVal as string).localeCompare(bVal as string, 'cs')
      return sortDir === 'asc' ? cmp : -cmp
    }
    // Jinak podle čísel
    const cmp = (Number(aVal) || 0) - (Number(bVal) || 0)
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Nemovitosti</h1>
        <Link href="/properties/new">
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Přidat nemovitost
          </button>
        </Link>
      </div>

      {/* Filtrovací pole */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm">Hledat:</label>
          <input
            type="text"
            placeholder="Název nebo adresa…"
            className="border px-3 py-2 rounded w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm">Min. jednotek:</label>
          <input
            type="number"
            min={0}
            className="border px-3 py-2 rounded w-32"
            value={minUnits}
            onChange={e => setMinUnits(e.target.value)}
            placeholder="např. 3"
          />
        </div>
        <div>
          <label className="block text-sm">Min. nájemné (Kč):</label>
          <input
            type="number"
            min={0}
            className="border px-3 py-2 rounded w-32"
            value={minRent}
            onChange={e => setMinRent(e.target.value)}
            placeholder="např. 10000"
          />
        </div>
        <div>
          <label className="block text-sm">Řadit podle:</label>
          <select
            className="border px-3 py-2 rounded w-40"
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
          >
            <option value="name">Název</option>
            <option value="unitCount">Počet jednotek</option>
            <option value="totalRent">Celkové nájemné</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">&nbsp;</label>
          <button
            className="border px-3 py-2 rounded bg-gray-100"
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            title={`Aktuálně ${sortDir === 'asc' ? 'vzestupně' : 'sestupně'}`}
          >
            {sortDir === 'asc' ? '⬆️ Vzestupně' : '⬇️ Sestupně'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <ul className="space-y-4">
        {filtered.map(prop => (
          <li
            key={prop.id}
            className="p-4 border rounded flex justify-between items-start"
          >
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-xl">{prop.name}</h2>
                {prop.hasNote && (
                  <span title="Poznámka" className="text-yellow-600">📝</span>
                )}
                {prop.hasAttachment && (
                  <span title="Příloha" className="text-blue-600">📎</span>
                )}
              </div>
              <p className="text-sm text-gray-600">{prop.address}</p>
              {prop.description && (
                <p className="mt-2 text-gray-800">{prop.description}</p>
              )}
              <div className="mt-2 text-sm text-gray-700 space-y-1">
                <div>
                  <strong>Počet jednotek:</strong> {prop.unitCount}
                </div>
                <div>
                  <strong>Obsazených jednotek:</strong> {prop.occupiedCount}
                </div>
                <div>
                  <strong>Celkové nájemné:</strong> {prop.totalRent} Kč
                </div>
              </div>
            </div>
            <Link href={`/properties/${prop.id}`}>
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
