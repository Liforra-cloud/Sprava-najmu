// najem-app/app/tenants/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DocumentUpload from '@/components/DocumentUpload'
import DocumentList from '@/components/DocumentList'
import PaymentSummary from '@/components/PaymentSummary'

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
  const [showDocForm, setShowDocForm] = useState(false)
  const [showLeaseForm, setShowLeaseForm] = useState(false)

  useEffect(() => {
    const fetchTenant = async () => {
      const res = await fetch(`/api/tenants/${id}`)
      if (!res.ok) {
        setTenant(null)
        return
      }
      const data = await res.json()
      setTenant(data.tenant)
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

      {/* Souhrn plateb */}
      <PaymentSummary tenantId={id} />

      {/* Sekce dokumenty */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Dokumenty k nájemníkovi</h2>
        {!showDocForm && (
          <button onClick={() => setShowDocForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded">
            Přidat dokument
          </button>
        )}
        {showDocForm && <DocumentUpload tenantId={id} />}
        <DocumentList tenantId={id} />
      </div>

      {/* Sekce přidání smlouvy */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Smlouvy</h2>
        {!showLeaseForm && (
          <button onClick={() => setShowLeaseForm(true)} className="bg-green-600 text-white px-4 py-2 rounded">
            Přidat smlouvu
          </button>
        )}
        {showLeaseForm && (
          <div className="border p-4 rounded bg-gray-50">
            {/* Zde bude formulář pro zadání nájemní smlouvy */}
            <p className="text-sm text-gray-600">Formulář pro vytvoření nové smlouvy zde...</p>
            {/* TODO: komponenta <LeaseForm tenantId={id} /> */}
          </div>
        )}
      </div>
    </div>
  )
}
