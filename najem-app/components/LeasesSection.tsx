// components/LeasesSection.tsx

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
        <Link href={`/tenants/${tenantId}/leases/new`}>
          <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">
            Přidat smlouvu
          </button>
        </Link>
      </div>
      <ul className="space-y-3">
        {leases.length === 0 && <li>Žádné smlouvy</li>}
        {leases.map(l => (
          <li key={l.id} className="p-3 border rounded">
            <div className="flex justify-between">
              <div>
                <strong>{l.name}</strong> ({l.unit.identifier} / {l.unit.property.name})
              </div>
              <Link href={`/leases/${l.id}/edit`}>
                <button className="text-blue-600 underline text-sm">Upravit</button>
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              {new Date(l.start_date).toLocaleDateString()} –{' '}
              {l.end_date ? new Date(l.end_date).toLocaleDateString() : '…'}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
