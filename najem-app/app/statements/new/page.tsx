// app/statement/new/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useState } from 'react';
import StatementTable from '@/components/StatementTable';

export default function NewStatementPage() {
  const [unitId, setUnitId] = useState('');
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01`);
  const [to, setTo] = useState(`${new Date().getFullYear()}-12`);

  // Pro jednoduchost zde můžeš načíst jednotky z API (nebo props).
  // Tady ukázka jak na to - potřebuješ API endpoint na jednotky:
  const [units, setUnits] = useState<{ id: string; identifier: string }[]>([]);
  useEffect(() => {
    fetch('/api/units').then(r => r.json()).then(setUnits);
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold mb-4">Nové vyúčtování</h1>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <label>
          <span>Jednotka: </span>
          <select
            value={unitId}
            onChange={e => setUnitId(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">-- Vyber jednotku --</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.identifier}</option>
            ))}
          </select>
        </label>
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

      {/* StatementTable render only if unit is selected */}
      {unitId && <StatementTable unitId={unitId} from={from} to={to} />}

      {/* Tlačítko Uložit/export */}
    </div>
  );
}
