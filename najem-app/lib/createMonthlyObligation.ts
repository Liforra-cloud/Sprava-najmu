// lib/createMonthlyObligation.ts
import { prisma } from './prisma'

type ChargeFlags = {
  rent_amount?: boolean
  monthly_water?: boolean
  monthly_gas?: boolean
  monthly_electricity?: boolean
  monthly_services?: boolean
  repair_fund?: boolean
}

type CustomCharge = {
  name: string
  amount: number
  enabled: boolean
}

// ⚠ Pomocná funkce pro bezpečný výběr dne splatnosti
function getValidDueDay(year: number, month: number, dueDay: number): number {
  const lastDay = new Date(year, month, 0).getDate()
  return Math.min(dueDay, lastDay)
}

export async function createMonthlyObligation({
  leaseId,
  year,
  month,
}: {
  leaseId: string
  year: number
  month: number
}) {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
  })

  if (!lease) throw new Error('Smlouva nenalezena')

  const flags: ChargeFlags = typeof lease.charge_flags === 'object' && lease.charge_flags !== null
    ? (lease.charge_flags as ChargeFlags)
    : {}

  const allCustomCharges: CustomCharge[] = Array.isArray(lease.custom_charges)
    ? lease.custom_charges as CustomCharge[]
    : []

  const enabledCustomCharges = allCustomCharges.filter(c => c.enabled)

  const rent = flags.rent_amount ? Number(lease.rent_amount ?? 0) : 0
  const water = flags.monthly_water ? Number(lease.monthly_water ?? 0) : 0
  const gas = flags.monthly_gas ? Number(lease.monthly_gas ?? 0) : 0
  const electricity = flags.monthly_electricity ? Number(lease.monthly_electricity ?? 0) : 0
  const services = flags.monthly_services ? Number(lease.monthly_services ?? 0) : 0
  const repairs = flags.repair_fund ? Number(lease.repair_fund ?? 0) : 0

  const custom = enabledCustomCharges.reduce(
    (sum, charge) => sum + Number(charge.amount ?? 0),
    0
  )

  const total = rent + water + gas + electricity + services + repairs + custom

  // ✅ Bezpečný výpočet dne splatnosti
  const safeDueDay = getValidDueDay(year, month, lease.due_day ?? 15)

  const obligation = await prisma.monthlyObligation.create({
    data: {
      lease_id: leaseId,
      year,
      month,
      rent,
      water,
      gas,
      electricity,
      services,
      repair_fund: repairs,
      total_due: total,
      paid_amount: 0,
      debt: total,
      charge_flags: flags,
      custom_charges: enabledCustomCharges,
      due_day: safeDueDay, // ✅ přidáno
      note: '',
    },
  })

  return obligation
}
