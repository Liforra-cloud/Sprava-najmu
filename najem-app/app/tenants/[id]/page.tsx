// app/tenants/[id]/page.tsx

import TenantHeader from '@/components/TenantHeader'
import RentSummaryCard from '@/components/RentSummaryCard'
import DocumentsSection from '@/components/DocumentsSection'
import LeasesSection from '@/components/LeasesSection'
import { notFound } from 'next/navigation'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

type RawLease = {
  id: string
  name: string
  rent_amount: number
  start_date: string
  end_date: string | null
  unit: Array<{
    id: string
    identifier: string
    property: Array<{ id: string; name: string }>
  }>
}

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

  // 1) Načteme nájemníka
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, full_name, email, phone, personal_id, address, employer, note, date_registered')
    .eq('id', id)
    .single()
  if (tenantError || !tenant) throw new Error('Nájemník nenalezen')

  // 2) Načteme surové smlouvy
  const { data: rawLeases, error: leasesError } = await supabase
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
    .eq('tenant_id', id)

  if (leasesError) console.error('Chyba při načítání smluv:', leasesError.message)

  // Přetypujeme a zploštíme unit/property do Lease[]
  const leases: Lease[] = (rawLeases ?? []).map((l: RawLease) => {
    const u = l.unit[0]
    const p = u.property[0]
    return {
      id: l.id,
      name: l.name,
      rent_amount: l.rent_amount,
      start_date: l.start_date,
      end_date: l.end_date,
      unit: {
        id: u.id,
        identifier: u.identifier,
        property: { id: p.id, name: p.name },
      },
    }
  })

  // 3) Shrnutí plateb – placeholder, doplňte reálný dotaz
  const summary: Summary = {
    totalDue: 0,
    paidThisMonth: 0,
    totalPaid: 0,
    debt: 0,
    debtThisMonth: 0,
  }

  return { tenant, leases, summary }
}

export default async function TenantPage({
  params,
}: {
  params: { id: string }
}) {
  let data
  try {
    data = await fetchTenantData(params.id)
  } catch (err) {
    console.error(err)
    return notFound()
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
