// najem-app/app/leases/new/page.tsx

'use client'

import LeaseForm from '@/components/LeaseForm'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NewLeasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Nová nájemní smlouva</h1>
      <LeaseForm
        initialTenantId={searchParams.get('tenant_id') || undefined}
        onSaved={lease => lease && router.push(`/leases/${lease.id}`)}
      />
    </div>
  )
}
