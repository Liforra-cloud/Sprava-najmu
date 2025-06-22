//app/units/[id]/statement/new/page.tsx

'use client';

import { useState } from 'react';
import StatementTable from '@/components/StatementTable';

export default function NewStatementPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Výchozí období – aktuální rok
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-01`;
  const defaultTo = `${now.getFullYear()}-12`;

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold mb-4">Nové vyúčtování</h1>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span>Období od:</span>
          <input
            type="month"
            value={from}
            max={to}
            onChange={e => setFrom(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2">
          <span>do:</span>
          <input
            type="month"
            value={to}
            min={from}
            onChange={e => setTo(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
      </div>

      <StatementTable unitId={id} from={from} to={to} />

      {/* Místo pro budoucí tlačítko "Uložit", export atd. */}
    </div>
  );
}
