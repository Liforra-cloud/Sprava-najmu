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
  hasNote?: boolean     // Indikátor poznámky
  hasAttachment?: boolean // Indikátor přílohy
}

export default function PropertiesPage() {
  const [list, setList] = useState<Property[]>([])
  const [search, setSearch] = useState('')
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

  // Filtrovaný list
  const filtered = list.filter(
    prop =>
      prop.name.toLowerCase().includes(search.toLowerCase()) ||
      prop.address.toLowerCase().includes(search.toLowerCase())
  )

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

      <input
        type="text"
        placeholder="Hledat podle názvu nebo adresy…"
        className="border px-3 py-2 mb-4 rounded w-full max-w-md"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

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
                {/* Indikátory poznámka/příloha */}
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

