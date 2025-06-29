// app/api/statement/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const statementId = params.id
  const statement = await prisma.statementEntry.findUnique({
    where: { id: statementId }
  })
  if (!statement || statement.title === '') {
    // Nenalezeno nebo nejde o hlavní záznam vyúčtování
    return NextResponse.json({ error: 'Vyúčtování nenalezeno' }, { status: 404 })
  }
  const lease = await prisma.lease.findUnique({ where: { id: statement.lease_id } })
  const tenant = lease ? await prisma.tenant.findUnique({ where: { id: lease.tenant_id } }) : null
  return NextResponse.json({
    id: statement.id,
    unit_id: statement.unit_id,
    lease_id: statement.lease_id,
    period_from: statement.period_from,
    period_to: statement.period_to,
    title: statement.title,
    tenant_name: tenant ? tenant.full_name : null
    // (pole data a annual_summary můžeme případně přidat, ale nejsou zde potřeba)
  })
}
