// najem-app/app/leases/[id]/edit/page.tsx

'use client'

import { useEffect, useState } from 'react'
import LeaseForm from '@/components/LeaseForm'
import { useParams } from 'next/navigation'

type CustomCharge = {
  name: string
  amount: number
  enabled: boolean
}

type LeaseFromAPI = {
  id: string
  name?: string
  unit_id: string
  tenant_id: string
  start_date: string
  end_date?: string
  rent_amount: number
  monthly_water: number
  monthly_gas: number
  monthly_electricity: number
  monthly_services: number
  repair_fund: number
  charge_flags: Record<string, boolean>
  custom_charges: CustomCharge[]
  custom_fields: Record<string, string | number | boolean | null>
  total_billable_rent: number
  created_at: string
  updated_at: string
}

export default function EditLeasePage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''
  const [lease, setLease] = useState<LeaseFromAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLease = async () => {
      try {
        const res = await fetch(`/api/leases/${id}`)
        if (!res.ok) throw new Error('Chyba při načítání smlouvy')
        const data: LeaseFromAPI = await res.json()

        // Defenzivní doplnění polí (pro případ, že backend některá pole nevrací)
        setLease({
          ...data,
          name: data.name ?? '',
          end_date: data.end_date ?? undefined,
          charge_flags: data.charge_flags ?? {},
          custom_charges: data.custom_charges ?? [],
          custom_fields: data.custom_fields ?? {},
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Neočekávaná chyba'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchLease()
  }, [id])

  if (loading) return <p>Načítám…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!lease) return <p>Smlouva nenalezena.</p>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upravit smlouvu</h1>
      <LeaseForm existingLease={lease} />
    </div>
  )
}

