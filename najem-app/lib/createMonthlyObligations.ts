// lib/createMonthlyObligations.ts 

import { prisma } from '@/lib/prisma'

export async function createMonthlyObligations(lease: {
  id: string,
  start_date: Date,
  end_date: Date,
  rent_amount: number,
  monthly_water: number,
  monthly_gas: number,
  monthly_electricity: number,
  monthly_services: number,
  repair_fund: number,
  custom_charges: any, // případně typizuj
  charge_flags: any,
}) {
  let current = new Date(lease.start_date)
  const end = new Date(lease.end_date)

  const obligations = []
  while (current <= end) {
    obligations.push({
      lease_id: lease.id,
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      rent: lease.rent_amount,
      water: lease.monthly_water,
      gas: lease.monthly_gas,
      electricity: lease.monthly_electricity,
      services: lease.monthly_services,
      repair_fund: lease.repair_fund,
      total_due:
        lease.rent_amount +
        lease.monthly_water +
        lease.monthly_gas +
        lease.monthly_electricity +
        lease.monthly_services +
        lease.repair_fund +
        (Array.isArray(lease.custom_charges)
          ? lease.custom_charges.reduce((acc, c) => acc + (c.enabled ? c.amount : 0), 0)
          : 0),
      paid_amount: 0,
      debt: 0,
      custom_charges: lease.custom_charges,
      charge_flags: lease.charge_flags,
    })
    current.setMonth(current.getMonth() + 1)
  }

  // Smazat staré
  await prisma.monthlyObligation.deleteMany({ where: { lease_id: lease.id } })

  // Vložit nové
  await prisma.monthlyObligation.createMany({ data: obligations })

  return obligations
}
