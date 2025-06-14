// najem-app/app/leases/[id]/edit/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import LeaseForm from '@/components/LeaseForm'

type Lease = {
  id: string
  name: string
  unit_id: string
  tenant_id: string
  start_date: string
  end_date?: string | null
  rent_amount: number
  monthly_water: number
  monthly_gas: number
  monthly_electricity: number
  monthly_services: number
  repair_fund: number
  custom_fields?: { label: string; value: number; billable: boolean }[]
  charge_flags?: Record<string, boolean>
  custom_charges?: { name: string; amount: number; enabled: boolean }[]
}

export default function EditLeasePage() {
  const { id } = useParams()
  const [lease, setLease] = useState<Lease | null>(null)

  useEffect(() => {
    const fetchLease = async () => {
      const res = await fetch(`/api/leases/${id}`)
      const data = await res.json()
      setLease(data)
    }
    fetchLease()
  }, [id])

  if (!lease) return <p>Načítání…</p>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upravit smlouvu</h1>
      <LeaseForm tenantId={lease.tenant_id} existingLease={lease} />
    </div>
  )
}

