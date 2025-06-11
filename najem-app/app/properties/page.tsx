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
}

export default function PropertiesPage() {
  const [list, setList] = useState<Property[]>([])
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

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <ul className="space-y-4">
        {list.map(prop => (
          <li
            key={prop.id}
            className="p-4 border rounded flex justify-between items-start"
          >
            <div>
              <h2 className="font-bold text-xl">{prop.name}</h2>
              <p className="text-sm text-gray-600">{prop.address}</p>
              {prop.description && (
                <p className="mt-2 text-gray-800">{prop.description}</p>
              )}
              {/* Nové souhrnné informace */}
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
