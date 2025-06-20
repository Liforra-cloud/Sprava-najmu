// app/tenants/[id]/page.tsx

import TenantHeader       from '@/components/TenantHeader'
import PaymentSummary     from '@/components/PaymentSummary'
import DocumentsSection   from '@/components/DocumentsSection'
import LeasesSection      from '@/components/LeasesSection'
import { notFound }       from 'next/navigation'
import { prisma }         from '@/lib/prisma'

type TenantForHeader = {
  id:              string
  full_name:       string
  email:           string
  phone:           string | null
  personal_id:     string | null
  address:         string | null
  employer:        string | null
  note:            string | null
  date_registered: string
}

type LeaseForList = {
  id:           string
  name:         string
  rent_amount:  number
  start_date:   string
  end_date:     string | null
  unit: {
    id:         string
    identifier: string
    property: {
      id:   string
      name: string
    }
  }
}

async function fetchTenantData(id: string): Promise<{
  tenant: TenantForHeader
  leases: LeaseForList[]
}> {
  // 1) Nájemník
  const rawTenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id:              true,
      full_name:       true,
      email:           true,
      phone:           true,
      personal_id:     true,
      address:         true,
      employer:        true,
      note:            true,
      date_registered: true,
    },
  })
  if (!rawTenant) {
    throw new Error('Nájemník nenalezen')
  }

  // 2) Přemapování na string
  const tenant: TenantForHeader = {
    id:              rawTenant.id,
    full_name:       rawTenant.full_name,
    email:           rawTenant.email,
    phone:           rawTenant.phone,
    personal_id:     rawTenant.personal_id,
    address:         rawTenant.address,
    employer:        rawTenant.employer,
    note:            rawTenant.note,
    date_registered: rawTenant.date_registered.toISOString(),
  }

  // 3) Smlouvy s jednotkou a nemovitostí
  const rawLeases = await prisma.lease.findMany({
    where: { tenant_id: id },
    select: {
      id:           true,
      name:         true,
      rent_amount:  true,
      start_date:   true,
      end_date:     true,
      unit: {
        select: {
          id:         true,
          identifier: true,
          property: {
            select: {
              id:   true,
              name: true,
            }
          }
        }
      }
    }
  })

  const leases: LeaseForList[] = rawLeases.map(l => {
    if (!l.unit || !l.unit.property) {
      throw new Error(`Smlouva ${l.id} chybí vazba na jednotku nebo nemovitost`)
    }
    return {
      id:          l.id,
      name:        l.name ?? '',
      rent_amount: l.rent_amount,
      start_date:  l.start_date.toISOString(),
      end_date:    l.end_date?.toISOString() ?? null,
      unit: {
        id:         l.unit.id,
        identifier: l.unit.identifier,
        property: {
          id:   l.unit.property.id,
          name: l.unit.property.name,
        }
      }
    }
  })

  return { tenant, leases }
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

      {/* Souhrn plateb – načte se klientsky */}
      <PaymentSummary tenantId={data.tenant.id} />

      {/* Dokumenty */}
      <DocumentsSection tenantId={data.tenant.id} />

      {/* Seznam smluv */}
      <LeasesSection leases={data.leases} tenantId={data.tenant.id} />
    </div>
  )
}
