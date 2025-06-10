//app/tenants/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Tenant = {
  id: string
  full_name: string
  email: string
  phone?: string
  address?: string
  date_registered: string
}

export default function TenantsPage() {
  const [list, setList] = useState<Tenant[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetch('/api/tenants')
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
        <h1 className="text-3xl font-bold">Nájemníci</h1>
        <Link href="/tenants/new">
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Přidat nájemníka
          </button>
        </Link>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <ul className="space-y-4">
        {list.map(tenant => (
          <li
            key={tenant.id}
            className="p-4 border rounded flex justify-between items-start"
          >
            <div>
              <h2 className="font-bold text-xl">{tenant.full_name}</h2>
              <p className="text-sm text-gray-600">{tenant.email} {tenant.phone && <span>({tenant.phone})</span>}</p>
              {tenant.address && (
                <p className="mt-2 text-gray-800">{tenant.address}</p>
              )}
              <p className="text-xs text-gray-400">Registrován: {new Date(tenant.date_registered).toLocaleDateString()}</p>
            </div>
            <Link href={`/tenants/${tenant.id}`}>
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
