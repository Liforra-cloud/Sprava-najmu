// app/statements/new/page.tsx

'use client';

import { useEffect, useState } from 'react';
import StatementTable from '@/components/StatementTable';

type Unit = { id: string; identifier: string; property_id: string };
type Property = { id: string; name: string };

export default function NewStatementPage() {
  const now = new Date();
  const thisYear = now.getFullYear();

  const [from, setFrom] = useState(`${thisYear}-01`);
  const [to, setTo] = useState(`${thisYear}-12`);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [uRes, pRes] = await Promise.all([
        fetch('/api/units'), // přizpůsob případně endpoint
        fetch('/api/properties'),
      ]);
      setUnits(await uRes.json());
      setProperties(await pRes.json());
    }
    fetchData();
  }, []);

  // Výběr jednotek podle nemovitosti
  const filteredUnits = selectedPropertyId
    ? units.filter(u => u.property_id === selectedPropertyId)
    : units;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold mb-4">Nové vyúčtování</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label>
          Nemovitost:
          <select
            className="border rounded p-2 w-full"
            value={selectedPropertyId}
            onChange={e => {
              setSelectedPropertyId(e.target.value);
              setUnitId('');
              setShowTable(false);
            }}
          >
            <option value="">-- Vyber nemovitost --</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label>
          Jednotka:
          <select
            className="border rounded p-2 w-full"
            value={unitId}
            onChange={e => {
              setUnitId(e.target.value);
              setShowTable(false);
            }}
            disabled={filteredUnits.length === 0}
          >
            <option value="">-- Vyber jednotku --</option>
            {filteredUnits.map(u => (
              <option key={u.id} value={u.id}>{u.identifier}</option>
            ))}
          </select>
        </label>
        <label>
          Období:
          <div className="flex gap-2">
            <input
              type="month"
              value={from}
              max={to}
              onChange={e => setFrom(e.target.value)}
              className="border rounded px-2 py-1"
            />
            <span>-</span>
            <input
              type="month"
              value={to}
              min={from}
              onChange={e => setTo(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
        </label>
      </div>

      <div>
        <button
          className="mt-4 bg-blue-700 text-white px-4 py-2 rounded"
          disabled={!unitId}
          onClick={() => setShowTable(true)}
        >
          Zobrazit vyúčtování
        </button>
      </div>

      {showTable && unitId && (
        <StatementTable unitId={unitId} from={from} to={to} />
      )}
    </div>
  );
}
