// najem-app/app/leases/[id]/edit/page.tsx


'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import LeaseForm from '@/components/LeaseForm'

type LeaseFromAPI = {
  id: string
  name?: string | null
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
  charge_flags?: Record<string, boolean>
  custom_charges?: {
    name: string
    amount: number
    enabled: boolean
  }[]
}

export default function LeaseEditPage() {
  const { id } = useParams()
  const [lease, setLease] = useState<LeaseFromAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLease = async () => {
      try {
        const res = await fetch(`/api/leases/${id}`)
        if (!res.ok) throw new Error('Chyba při načítání smlouvy')
        const data = await res.json()

        // Transformace null → undefined pro TS kompatibilitu
        setLease({
          ...data,
          name: data.name ?? undefined,
          end_date: data.end_date ?? undefined,
          charge_flags: data.charge_flags ?? {},
          custom_charges: data.custom_charges ?? []
        })
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Neočekávaná chyba')
      } finally {
        setLoading(false)
      }
    }

    fetchLease()
  }, [id])

  if (loading) return <p>Načítám...</p>
  if (error || !lease) return <p className="text-red-600">Chyba: {error || 'Smlouva nenalezena'}</p>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upravit smlouvu</h1>
      <LeaseForm tenantId={lease.tenant_id} existingLease={lease} />
    </div>
  )
}
