// najem-app/app/leases/[id]/edit/page.tsx

'use client'

import { useEffect, useState, useCallback } from 'react'
import LeaseForm from '@/components/LeaseForm'
import MonthlyObligationsTable from '@/components/MonthlyObligationsTable'
import { useParams, useRouter } from 'next/navigation'

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
  due_date?: string
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
  const router = useRouter()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''

  const [lease, setLease] = useState<LeaseFromAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState('')

  const fetchLease = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/leases/${id}`)
      if (!res.ok) throw new Error('Chyba při načítání smlouvy')
      const data: LeaseFromAPI = await res.json()
      setLease({
        ...data,
        name: data.name ?? '',
        end_date: data.end_date ?? undefined,
        due_date: data.due_date ?? undefined,
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
  }, [id])

  useEffect(() => {
    if (id) fetchLease()
  }, [id, fetchLease])

  const handleDelete = async () => {
    if (confirmDelete !== 'Smazat smlouvu') return
    const res = await fetch(`/api/leases/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/leases')
    else alert('Chyba při mazání')
  }

  if (loading) return <p>Načítám…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!lease) return <p>Smlouva nenalezena.</p>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Upravit smlouvu</h1>
      <LeaseForm existingLease={lease} onSaved={fetchLease} />

      <div>
        <label className="block mb-1 font-medium">Potvrďte smazání napsáním "Smazat smlouvu":</label>
        <input
          type="text"
          value={confirmDelete}
          onChange={e => setConfirmDelete(e.target.value)}
          placeholder="Smazat smlouvu"
          className="border p-2 rounded w-full max-w-xs"
        />
        <button
          disabled={confirmDelete !== 'Smazat smlouvu'}
          onClick={handleDelete}
          className="bg-red-600 text-white px-4 py-2 rounded mt-2 disabled:opacity-50"
        >
          Smazat smlouvu
        </button>
      </div>

      <div>
        <MonthlyObligationsTable leaseId={lease.id} />
      </div>
    </div>
  )
}

