// app/tenants/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Tenant = {
  id: string
  full_name: string
  email: string
  phone?: string
  personal_id?: string
  address?: string
  employer?: string
  note?: string
  date_registered: string
}

export default function TenantDetailPage() {
  const id = (useParams() as Record<string, string>).id
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [totalRent, setTotalRent] = useState<number>(0)
  const [totalDebt, setTotalDebt] = useState<number>(0)

  useEffect(() => {
    const fetchTenant = async () => {
      const res = await fetch(`/api/tenants/${id}`)
      if (!res.ok) {
        setTenant(null)
        return
      }
      const data = await res.json()
      setTenant(data.tenant)
      setTotalRent(data.totalRent)
      setTotalDebt(data.totalDebt)
    }
    fetchTenant()
  }, [id])

  if (!tenant) return <p>Načítání...</p>

  return (
    <div className="space-y-6 p-6 max-w-xl mx-auto">
      <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold">{tenant.full_name}</h1>
      </div>

      {/* Zobrazení celkového nájemného a dluhu */}
      <div className="mt-4">
        <div>
          <strong>Celkové nájemné:</strong> {totalRent} Kč
        </div>
        <div className={`mt-2 ${totalDebt > 0 ? 'text-red-600' : ''}`}>
          <strong>Celkový dluh:</strong> {totalDebt} Kč
        </div>
      </div>
    </div>
  )
}
