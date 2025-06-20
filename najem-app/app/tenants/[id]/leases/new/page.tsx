// app/tenants/[id]/leases/new/page.tsx

'use client'

import { useRouter } from 'next/navigation'
import LeaseForm from '@/components/LeaseForm'

interface NewLeasePageProps {
  params: {
    id: string
  }
}

export default function NewLeasePage({ params }: NewLeasePageProps) {
  const router = useRouter()
  const tenantId = params.id

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Přidat novou smlouvu</h1>
      <LeaseForm
        initialTenantId={tenantId}
        onSaved={() => {
          // po uložení přejdi zpátky na detail nájemníka
          router.push(`/tenants/${tenantId}`)
        }}
      />
    </div>
  )
}
