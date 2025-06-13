// app/tenants/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DocumentUpload from '@/components/DocumentUpload'
import DocumentList from '@/components/DocumentList'

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

      {/* Zobrazení všech informací o nájemníkovi */}
      <div className="mt-4">
        <div><strong>Email:</strong> {tenant.email}</div>
        <div><strong>Telefon:</strong> {tenant.phone || '—'}</div>
        <div><strong>Rodné číslo:</strong> {tenant.personal_id || '—'}</div>
        <div><strong>Adresa:</strong> {tenant.address || '—'}</div>
        <div><strong>Zaměstnavatel:</strong> {tenant.employer || '—'}</div>
        <div><strong>Poznámka:</strong> {tenant.note || '—'}</div>
        <div><strong>Registrován:</strong> {new Date(tenant.date_registered).toLocaleDateString()}</div>
      </div>

      {/* Zobrazení celkového nájemného a dluhu */}
      <div className="mt-4">
        <div><strong>Celkové nájemné:</strong> {totalRent} Kč</div>
        <div className={`mt-2 ${totalDebt > 0 ? 'text-red-600' : ''}`}><strong>Celkový dluh:</strong> {totalDebt} Kč</div>
      </div>

      {/* Dokumenty k nájemníkovi */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Dokumenty k nájemníkovi</h2>
        <DocumentUpload tenantId={id} />
        <DocumentList tenantId={id} />
      </div>
    </div>
  )
}
