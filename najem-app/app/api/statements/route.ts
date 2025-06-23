// app/api/statement/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const unitId = searchParams.get('unitId');
  const from = searchParams.get('from'); // 'YYYY-MM'
  const to = searchParams.get('to');     // 'YYYY-MM'

  if (!unitId || !from || !to) {
    return NextResponse.json({ error: 'unitId, from a to jsou povinné parametry.' }, { status: 400 });
  }

  // Rozparsuj roky a měsíce
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);

  // Načti všechny monthly_obligations pro danou jednotku a období
  const obligations = await prisma.monthlyObligation.findMany({
    where: {
      unit_id: unitId,
      OR: [
        {
          year: fromYear,
          month: { gte: fromMonth },
        },
        {
          year: toYear,
          month: { lte: toMonth },
        },
        {
          year: { gt: fromYear, lt: toYear },
        }
      ]
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }]
  });

  return NextResponse.json(obligations);
}
