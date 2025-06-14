//lib/createMonthlyObligation.ts

import { prisma } from '@/lib/prisma'

type CreateMonthlyObligationInput = {
  leaseId: string
  year: number
  month: number
}

export async function createMonthlyObligation({ leaseId, year, month }: CreateMonthlyObligationInput) {
  const lease = await prisma.lease.findUnique({ where: { id: leaseId } })
  if (!lease) throw new Error('Lease not found')

  const chargeFlags = lease.charge_flags ?? {}
  const customCharges = lease.custom_charges as Array<{ name: string; amount: number; enabled: boolean }> ?? []

  // Vezmi jen enabled vlastní poplatky
  const activeCustomCharges = customCharges.filter(c => c.enabled)
  const customTotal = activeCustomCharges.reduce((sum, c) => sum + (c.amount || 0), 0)

  // Výpočet pouze za zaškrtnuté (účtovat) položky
  const rent = chargeFlags.rent_amount ? Number(lease.rent_amount ?? 0) : 0
  const water = chargeFlags.monthly_water ? Number(lease.monthly_water ?? 0) : 0
  const gas = chargeFlags.monthly_gas ? Number(lease.monthly_gas ?? 0) : 0
  const electricity = chargeFlags.monthly_electricity ? Number(lease.monthly_electricity ?? 0) : 0
  const services = chargeFlags.monthly_services ? Number(lease.monthly_services ?? 0) : 0
  const repair_fund = chargeFlags.repair_fund ? Number(lease.repair_fund ?? 0) : 0

  const total_due = rent + water + gas + electricity + services + repair_fund + customTotal

  // Kontrola, zda už závazek existuje
  const exists = await prisma.monthly_obligations.findFirst({
    where: { lease_id: leaseId, year, month }
  })
  if (exists) return exists

  const obligation = await prisma.monthly_obligations.create({
    data: {
      lease_id: leaseId,
      year,
      month,
      rent,
      water,
      gas,
      electricity,
      services,
      repair_fund,
      custom_charges: activeCustomCharges,    // ← snapshot na daný měsíc!
      charge_flags: chargeFlags,              // ← snapshot na daný měsíc!
      total_due,
      paid_amount: 0,
      debt: total_due,
    }
  })
  return obligation
}
