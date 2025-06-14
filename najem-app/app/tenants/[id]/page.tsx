// najem-app/app/tenants/[id]/page.tsx

// najem-app/app/tenants/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DocumentUpload from '@/components/DocumentUpload'
import DocumentList from '@/components/DocumentList'
import PaymentSummary from '@/components/PaymentSummary'
import LeaseForm from '@/components/LeaseForm'

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

type Unit = {
  id: string
  identifier: string
  property: {
    name: string
  }
}

type Lease = {
  id: string
  name?: string
  unit: Unit
  rent_amount: number
  start_date: string
  end_date?: string
  custom_fields?: { label: string; value: number; billable: boolean }[]
  monthly_water?: number
  monthly_gas?: number
  monthly_electricity?: number
  monthly_services?: number
  repair_fund?: number
}

export default function TenantDetailPage() {
  const id = (useParams() as Record<string, string>).id
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [leases, setLeases] = useState<Lease[]>([])
  const [showDocForm, setShowDocForm] = useState(false)
  const [showLeaseForm, setShowLeaseForm] = useState(false)

  useEffect(() => {
    const fetchTenantAndLeases = async () => {
      const res = await fetch(`/api/tenants/${id}`)
      if (!res.ok) {
        setTenant(null)
        setLeases([])
        return
      }
      const data = await res.json()
      setTenant(data.tenant)
      // Leases musí přijít s includem jednotky i nemovitosti
      setLeases(Array.isArray(data.leases) ? data.leases : [])
    }
    fetchTenantAndLeases()
  }, [id])

  if (!tenant) return <p>Načítání...</p>

  // Pomocná funkce na datum
  function formatDate(dateStr?: string) {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleDateString('cs-CZ')
  }

  // Pomocná funkce na výpočet celkového nájemného
  function getTotalBillable(lease: Lease) {
    let total = 0
    total += Number(lease.rent_amount || 0)
    total += Number(lease.monthly_water || 0)
    total += Number(lease.monthly_gas || 0)
    total += Number(lease.monthly_electricity || 0)
    total += Number(lease.monthly_services || 0)
    total += Number(lease.repair_fund || 0)
    if (lease.custom_fields && Array.isArray(lease.custom_fields)) {
      total += lease.custom_fields
        .filter(field => field.billable)
        .reduce((sum, field) => sum + Number(field.value || 0), 0)
    }
    return total
  }

  return (
    <div className="space-y-6 p-6 max-w-xl mx-auto">
      <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold">{tenant.full_name}</h1>
      </div>

      {/* Informace o nájemníkovi */}
      <div className="mt-4">
        <div><strong>Email:</strong> {tenant.email}</div>
        <div><strong>Telefon:</strong> {tenant.phone || '—'}</div>
        <div><strong>Rodné číslo:</strong> {tenant.personal_id || '—'}</div>
        <div><strong>Adresa:</strong> {tenant.address || '—'}</div>
        <div><strong>Zaměstnavatel:</strong> {tenant.employer || '—'}</div>
        <div><strong>Poznámka:</strong> {tenant.note || '—'}</div>
        <div><strong>Registrován:</strong> {formatDate(tenant.date_registered)}</div>
      </div>

      {/* Souhrn plateb */}
      <PaymentSummary tenantId={id} />

      {/* Dokumenty */}
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

      {/* Smlouvy */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Smlouvy</h2>
        <ul>
          {leases.length === 0 && <li>Žádné smlouvy nenalezeny</li>}
          {leases.map(lease => (
            <li key={lease.id} className="border-b py-2">
              <strong>{lease.name || 'Bez názvu'}</strong><br />
              Jednotka: {lease.unit?.identifier || '—'}<br />
              Nemovitost: {lease.unit?.property?.name || '—'}<br />
              Celkové nájemné: {getTotalBillable(lease)} Kč<br />
              Od: {formatDate(lease.start_date)} Do: {formatDate(lease.end_date)}
            </li>
          ))}
        </ul>
        {!showLeaseForm && (
          <button onClick={() => setShowLeaseForm(true)} className="bg-green-600 text-white px-4 py-2 rounded">
            Přidat smlouvu
          </button>
        )}
        {showLeaseForm && (
          <div className="border p-4 rounded bg-gray-50">
            <LeaseForm tenantId={id} />
          </div>
        )}
      </div>
    </div>
  )
}
