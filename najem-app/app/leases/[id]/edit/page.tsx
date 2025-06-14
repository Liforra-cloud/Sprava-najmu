// najem-app/app/leases/[id]/edit/page.tsx

import { notFound } from 'next/navigation'
import LeaseForm from '@/components/LeaseForm'
import { Lease } from '@prisma/client'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

export default async function LeaseEditPage({ params }: { params: { id: string } }) {
  const id = params.id

  const res = await fetch(`${SITE_URL}/api/leases/${id}`, {
    cache: 'no-store',
  })

  if (!res.ok) return notFound()

  const lease: Lease = await res.json()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upravit smlouvu</h1>
      <LeaseForm tenantId={lease.tenant_id} existingLease={lease} />
    </div>
  )
}
