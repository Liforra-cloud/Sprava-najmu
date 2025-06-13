// app/tenants/page.tsx

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
  active_unit_count?: number
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(false)

  // Načti nájemníky
  useEffect(() => {
    fetch('/api/tenants')
      .then(async res => {
        const json = await res.json()
        if (res.ok && Array.isArray(json)) setTenants(json)
        else throw new Error(json.error || 'Chyba při načítání')
      })
      .catch(err => setError(err.message))
  }, [])

  // Filtrování podle jména a aktivních
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch =
      !search ||
      tenant.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (tenant.email && tenant.email.toLowerCase().includes(search.toLowerCase()))
    const matchesActive = !showOnlyActive || (tenant.active_unit_count ?? 0) > 0
    return matchesSearch && matchesActive
  })

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Nájemníci</h1>
        <Link href="/tenants/new">
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Přidat nájemníka
          </button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div>
          <label className="font-semibold mr-2">Hledat:</label>
          <input
            type="text"
            className="border px-2 py-1 rounded"
            placeholder="Jméno nebo e-mail"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="font-semibold mr-2">Pouze aktivní</label>
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={e => setShowOnlyActive(e.target.checked)}
          />
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2">Jméno</th>
              <th className="px-4 py-2">E-mail</th>
              <th className="px-4 py-2">Telefon</th>
              <th className="px-4 py-2">Počet jednotek</th>
              <th className="px-4 py-2">Akce</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map(tenant => (
              <tr key={tenant.id} className="border-t">
                <td className="px-4 py-2 font-bold">
                  <Link
                    href={`/tenants/${tenant.id}`}
                    className="text-blue-700 underline hover:text-blue-900"
                  >
                    {tenant.full_name}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  {tenant.email ? (
                    <a href={`mailto:${tenant.email}`} className="underline text-blue-700">{tenant.email}</a>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-2">
                  {tenant.phone ? (
                    <a href={`tel:${tenant.phone}`} className="underline text-blue-700">{tenant.phone}</a>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-2 text-center">{tenant.active_unit_count ?? 0}</td>
                <td className="px-4 py-2">
                  <Link href={`/tenants/${tenant.id}`}>
                    <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                      Detail
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
            {filteredTenants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Žádný nájemník neodpovídá filtru.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
