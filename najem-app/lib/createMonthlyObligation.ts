//lib/createMonthlyObligation.ts

import { prisma } from './prisma'
type ChargeFlags = {
  rent_amount?: boolean
  monthly_water?: boolean
  monthly_gas?: boolean
  monthly_electricity?: boolean
  monthly_services?: boolean
  repair_fund?: boolean
}

export async function createMonthlyObligation({
  leaseId,
  year,
  month
}: {
  leaseId: string
  year: number
  month: number
}) {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId }
  })

  if (!lease) throw new Error('Smlouva nenalezena')

  const flags: ChargeFlags = (lease.charge_flags ?? {}) as ChargeFlags

  const rent = flags.rent_amount ? Number(lease.rent_amount ?? 0) : 0
  const water = flags.monthly_water ? Number(lease.monthly_water ?? 0) : 0
  const gas = flags.monthly_gas ? Number(lease.monthly_gas ?? 0) : 0
  const electricity = flags.monthly_electricity ? Number(lease.monthly_electricity ?? 0) : 0
  const services = flags.monthly_services ? Number(lease.monthly_services ?? 0) : 0
  const repairs = flags.repair_fund ? Number(lease.repair_fund ?? 0) : 0

  const total = rent + water + gas + electricity + services + repairs

  return {
    year,
    month,
    leaseId,
    amount: total
  }
}

