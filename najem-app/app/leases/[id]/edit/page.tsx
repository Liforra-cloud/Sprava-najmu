// najem-app/app/leases/[id]/edit/page.tsx

import LeaseForm from '@/components/LeaseForm'
import { notFound } from 'next/navigation'

async function getLease(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/leases/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function EditLeasePage({ params }: { params: { id: string } }) {
  const lease = await getLease(params.id)
  if (!lease) return notFound()

  // Ensure charge_flags always exists
  if (!lease.charge_flags) {
    lease.charge_flags = {}
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upravit smlouvu</h1>
      <LeaseForm tenantId={lease.tenant_id} existingLease={lease} />
    </div>
  )
}


