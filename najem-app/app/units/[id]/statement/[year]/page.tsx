// app/units/[id]/statement/[year]/page.tsx

'use client';
import StatementTable from '@/components/StatementTable';

export default function StatementPage() {
  return (
    <div className="max-w-4xl mx-auto mt-8">
      <StatementTable />
    </div>
  );
}
