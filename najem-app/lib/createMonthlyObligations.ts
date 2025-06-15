// lib/createMonthlyObligations.ts

import { prisma } from '@/lib/prisma'

type CustomCharge = {
  name: string
  amount: number
  enabled: boolean
}

type ChargeFlags = {
  rent_amount?: boolean
  monthly_water?: boolean
  monthly_gas?: boolean
  monthly_electricity?: boolean
  monthly_services?: boolean
  repair_fund?: boolean
  [key: string]: boolean | undefined
}

type Lease = {
  id: string,
  start_date: Date,
  end_date: Date,
  rent_amount: number,
  monthly_water: number,
  monthly_gas: number,
  monthly_electricity: number,
  monthly_services: number,
  repair_fund: number,
  custom_charges: CustomCharge[],
  charge_flags: ChargeFlags,
}

export async function createMonthlyObligations(lease: Lease) {
  const start = new Date(lease.start_date)
  const end = new Date(lease.end_date)

  const obligations = []
  let iter = new Date(start)

  while (iter <= end) {
    const year = iter.getFullYear()
    const month = iter.getMonth() + 1

    // Výpočet započtených položek podle charge_flags
    const flags = lease.charge_flags ?? {}
    const rent = flags.rent_amount ? lease.rent_amount : 0
    const water = flags.monthly_water ? lease.monthly_water : 0
    const gas = flags.monthly_gas ? lease.monthly_gas : 0
    const electricity = flags.monthly_electricity ? lease.monthly_electricity : 0
    const services = flags.monthly_services ? lease.monthly_services : 0
    const repair_fund = flags.repair_fund ? lease.repair_fund : 0

    // Součet custom_charges
    const customTotal = Array.isArray(lease.custom_charges)
      ? lease.custom_charges.reduce((acc, c) => acc + (c.enabled ? c.amount : 0), 0)
      : 0

    obligations.push({
      lease_id: lease.id,
      year,
      month,
      rent,
      water,
      gas,
      electricity,
      services,
      repair_fund,
      total_due: rent + water + gas + electricity + services + repair_fund + customTotal,
      paid_amount: 0,
      debt: 0,
      custom_charges: lease.custom_charges,
      charge_flags: lease.charge_flags,
    })

    // posuň na další měsíc
    iter = new Date(iter.setMonth(iter.getMonth() + 1))
  }

  // Smazat staré
  await prisma.monthlyObligation.deleteMany({ where: { lease_id: lease.id } })

  // Vložit nové
  await prisma.monthlyObligation.createMany({ data: obligations })

  return obligations
}
