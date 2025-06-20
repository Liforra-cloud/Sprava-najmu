// app/tenants/[id]/page.tsx

import TenantHeader    from '@/components/TenantHeader'
import RentSummaryCard from '@/components/RentSummaryCard'
import DocumentsSection from '@/components/DocumentsSection'
import LeasesSection   from '@/components/LeasesSection'
import { notFound }    from 'next/navigation'
import { prisma }      from '@/lib/prisma'

type Lease = {
  id: string
  name: string | null
  rent_amount: number
  start_date: Date
  end_date: Date | null
  unit: {
    id: string
    identifier: string
    property: { id: string; name: string }
  }
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
  date_registered: Date
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
  // 1) Načíst nájemníka
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      personal_id: true,
      address: true,
      employer: true,
      note: true,
      date_registered: true,
    },
  })
  if (!tenant) throw new Error('Nájemník nenalezen')

  // 2) Načíst smlouvy včetně unit → property
  const rawLeases = await prisma.lease.findMany({
    where: { tenant_id: id },
    select: {
      id: true,
      name: true,
      rent_amount: true,
      start_date: true,
      end_date: true,
      unit: {
        select: {
          id: true,
          identifier: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  // 3) Přemapovat na náš typ
  const leases: Lease[] = rawLeases.map(l => {
    const u = l.unit
    if (!u || !u.property) {
      throw new Error(`Chybí jednotka nebo nemovitost pro smlouvu ${l.id}`)
    }
    return {
      id: l.id,
      name: l.name,
      rent_amount: l.rent_amount,
      start_date: l.start_date,
      end_date: l.end_date,
      unit: {
        id: u.id,
        identifier: u.identifier,
        property: {
          id: u.property.id,
          name: u.property.name,
        },
      },
    }
  })

  // 4) Shrnutí plateb (zatím placeholder)
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
      <TenantHeader   tenant={data.tenant} />
      <RentSummaryCard summary={data.summary} />
      <DocumentsSection tenantId={data.tenant.id} />
      <LeasesSection  leases={data.leases} tenantId={data.tenant.id} />
    </div>
  )
}
