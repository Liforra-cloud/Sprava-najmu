// app/tenants/[id]/page.tsx

import TenantHeader from '@/components/TenantHeader'
import RentSummaryCard from '@/components/RentSummaryCard'
import DocumentsSection from '@/components/DocumentsSection'
import LeasesSection from '@/components/LeasesSection'
import { notFound } from 'next/navigation'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

type Lease = {
  id: string
  name: string
  rent_amount: number
  start_date: string
  end_date: string | null
  unit: { id: string; identifier: string; property: { id: string; name: string } }
}

type Tenant = {
  id: string
  full_name: string
  email: string
  phone: string | null
  personal_id: string | null
  address: string | null
  employer: string | null
  note: string | null
  date_registered: string
}

type Summary = {
  totalDue: number
  paidThisMonth: number
  totalPaid: number
  debt: number
  debtThisMonth: number
}

async function fetchTenantData(id: string): Promise<{
  tenant: Tenant
  leases: Lease[]
  summary: Summary
}> {
  const supabase = supabaseRouteClient()

  // 1) Nájemník + smlouvy
  const [{ data: tenant }, { data: leases }] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', id).single(),
    supabase
      .from('leases')
      .select(`
        id,
        name,
        rent_amount,
        start_date,
        end_date,
        unit:unit_id (
          id,
          identifier,
          property:property_id ( id, name )
        )
      `)
      .eq('tenant_id', id),
  ])

  if (!tenant) throw new Error('Nájemník nenalezen')

  // 2) Shrnutí plateb – tady si doplňte reálný dotaz na monthly_obligations/payments
  const summary: Summary = {
    totalDue: 0,
    paidThisMonth: 0,
    totalPaid: 0,
    debt: 0,
    debtThisMonth: 0,
  }

  return { tenant, leases: leases ?? [], summary }
}

export default async function TenantPage({ params }: { params: { id: string } }) {
  let data
  try {
    data = await fetchTenantData(params.id)
  } catch {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <TenantHeader tenant={data.tenant} />
      <RentSummaryCard summary={data.summary} />
      <DocumentsSection tenantId={data.tenant.id} />
      <LeasesSection leases={data.leases} tenantId={data.tenant.id} />
    </div>
  )
}
