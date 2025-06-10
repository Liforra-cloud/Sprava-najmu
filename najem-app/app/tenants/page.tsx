//app/tenants/page.tsx

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Tenant = {
  id: string
  full_name: string
  email: string
  phone?: string
  personal_id?: string
  address?: string
  employer?: string
  note?: string
  date_registered: string
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tenants')
      .then(async res => {
        const json = await res.json()
        if (res.ok && Array.isArray(json)) setTenants(json)
        else throw new Error(json.error || 'Chyba při načítání')
      })
      .catch(err => setError(err.message))
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Nájemníci</h1>
        <Link href="/tenants/new">
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Přidat nájemníka
          </button>
        </Link>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <ul className="space-y-3">
        {tenants.map(tenant => (
          <li
            key={tenant.id}
            className="p-4 border rounded flex justify-between items-center"
          >
            <div>
              <div className="font-bold">{tenant.full_name}</div>
              <div className="text-sm text-gray-600">{tenant.email}</div>
              <div className="text-xs text-gray-500">{tenant.note}</div>
            </div>
            <Link href={`/tenants/${tenant.id}`}>
              <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                Detail
              </button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}


