// app/units/[id]/statement/page.tsx

'use client';

import { useState } from 'react';
import StatementTable from '@/components/StatementTable';

export default function StatementPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Výchozí období – třeba aktuální rok
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-01`);
  const [to, setTo] = useState(`${now.getFullYear()}-12`);

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Vyúčtování</h1>
      <div className="flex items-center gap-4">
        <label>
          Období od: <input type="month" value={from} onChange={e => setFrom(e.target.value)} />
        </label>
        <label>
          do: <input type="month" value={to} onChange={e => setTo(e.target.value)} />
        </label>
      </div>
      <StatementTable unitId={id} from={from} to={to} />
    </div>
  );
}


