// app/units/page.tsx

'use client'

import { useEffect, useState } from 'react'
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

export default function UnitsPage() {
  const [list, setList] = useState<Unit[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetch('/api/units')
      .then(async res => {
        const json = await res.json()
        if (res.ok && Array.isArray(json)) {
          setList(json)
        } else {
          throw new Error(json.error || 'Chyba při načítání jednotek')
        }
      })
      .catch(err => setError(err.message))
  }, [])

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

