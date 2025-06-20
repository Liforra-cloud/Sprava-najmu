// components/LeasesSection.tsx

'use client'

import Link from 'next/link'

type Lease = {
  id: string
  name: string
  rent_amount: number
  start_date: string
  end_date: string | null
  unit: { identifier: string; property: { name: string } }
}

export default function LeasesSection({
  leases,
  tenantId,
}: {
  leases: Lease[]
  tenantId: string
}) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Smlouvy</h2>
        <Link
          href={`/tenants/${tenantId}/leases/new`}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          Přidat smlouvu
        </Link>
      </div>
      <ul className="space-y-3">
        {leases.length === 0 && (
          <li className="text-gray-500">Žádné smlouvy</li>
        )}
        {leases.map((l) => (
          <li
            key={l.id}
            className="p-3 border rounded hover:bg-gray-50 transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <strong>{l.name || '—'}</strong>{' '}
                ({l.unit.identifier} /{' '}
                {l.unit.property.name})
              </div>
              <Link
                href={`/tenants/${tenantId}/leases/${l.id}/edit`}
                className="text-blue-600 underline text-sm"
              >
                Upravit
              </Link>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {new Date(l.start_date).toLocaleDateString()}{' '}
              –{' '}
              {l.end_date
                ? new Date(l.end_date).toLocaleDateString()
                : 'běží'}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
