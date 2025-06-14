//scripts/generateMonthlyObligations.ts

import { prisma } from '@/lib/prisma'
import { createMonthlyObligation } from '@/lib/createMonthlyObligation'

/**
 * Vygeneruje měsíční závazky pro všechny platné smlouvy v daném měsíci
 * @param year - např. 2024
 * @param month - např. 6
 */
export async function generateMonthlyObligationsForAllLeases(year: number, month: number) {
  // Najdi všechny smlouvy, které v daný měsíc platí
  const leases = await prisma.lease.findMany({
    where: {
      start_date: { lte: new Date(`${year}-${month}-31`) },
      OR: [
        { end_date: null },
        { end_date: { gte: new Date(`${year}-${month}-01`) } }
      ]
    }
  })

  const promises = leases.map(lease =>
    createMonthlyObligation({ leaseId: lease.id, year, month })
      .then(o => ({ leaseId: lease.id, status: 'ok' }))
      .catch(e => ({ leaseId: lease.id, status: 'error', error: e.message }))
  )

  const results = await Promise.all(promises)
  console.log('Výsledek dávky:', results)
  return results
}
