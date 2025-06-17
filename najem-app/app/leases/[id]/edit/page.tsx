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
  const id =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : ''

  const [lease, setLease] = useState<LeaseFromAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
    if (confirmDelete !== 'Smazat smlouvu') {
      setDeleteError('Pro smazání musíte zadat přesný text: "Smazat smlouvu"')
      return
    }

    const res = await fetch(`/api/leases/${id}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      router.push('/leases')
    } else {
      const error = await res.json()
      setDeleteError(error.message || 'Nepodařilo se smazat smlouvu')
    }
  }

  if (loading) return <p>Načítám…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!lease) return <p>Smlouva nenalezena.</p>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Upravit smlouvu</h1>

      <LeaseForm existingLease={lease} onSaved={fetchLease} />

      <div>
        <h2 className="text-lg font-bold mb-2">Měsíční povinnosti</h2>
        <MonthlyObligationsTable leaseId={lease.id} />
      </div>

      <div className="border border-red-300 p-4 rounded">
        <h2 className="text-red-600 font-bold text-lg mb-2">Smazat smlouvu</h2>
        <p>Pro potvrzení napište &quot;Smazat smlouvu&quot;:</p>
        <input
          type="text"
          value={confirmDelete}
          onChange={e => setConfirmDelete(e.target.value)}
          className="border p-2 mt-2 w-full"
        />
        {deleteError && <p className="text-red-600 mt-1">{deleteError}</p>}
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-4 py-2 mt-4 rounded"
        >
          Smazat smlouvu
        </button>
      </div>
    </div>
  )
}

