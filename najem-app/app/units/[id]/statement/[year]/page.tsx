// app/units/[id]/statement/[year]/page.tsx

'use client';

import StatementTable from '@/components/StatementTable';

// Next.js předává params jako props:
export default function StatementPage({ params }: { params: { id: string; year: string } }) {
  const { id, year } = params;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      {/* Předáváš id a year do komponenty */}
      <StatementTable unitId={id} year={year} />
    </div>
  );
}
