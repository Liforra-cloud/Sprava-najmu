// app/units/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type unit = {
  id: string
  name: string
  address: string
  description?: string
}

export default function unitsPage() {
  const [list, setList] = useState<unit[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetch('/api/units')
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
        <Link href="/units/new">
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
            </div>
            <Link href={`/units/${prop.id}`}>
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
