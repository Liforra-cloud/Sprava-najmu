// components/StatementTable.tsx

'use client';
import { useEffect, useState } from 'react';

// --- Pivotní matice z API ---
type MatrixRow = {
  id: string;
  name: string;
  values: (number | '')[];
  total: number;
};
type PaymentsMatrix = {
  months: { month: number; year: number }[];
  data: MatrixRow[];
};

// Typ položky pro první tabulku
export type StatementItem = {
  id: string;
  name: string;
  totalAdvance: number;       // součet záloh
  consumption: number | '';   // spotřeba za období
  unit: string;
  totalCost: number | '';     // skutečné náklady
  diff: number;               // přeplatek/nedoplatek
  chargeableMonths: number[]; // měsíce, kdy byla položka účtovaná
  manual?: boolean;
};

const PREDEFINED_ITEMS = [
  { id: 'rent', name: 'Nájem', unit: 'Kč' },
  { id: 'electricity', name: 'Elektřina', unit: 'kWh' },
  { id: 'water', name: 'Voda', unit: 'm³' },
  { id: 'gas', name: 'Plyn', unit: 'm³' },
  { id: 'services', name: 'Služby', unit: 'Kč' },
  { id: 'repair_fund', name: 'Fond oprav', unit: 'Kč' },
];

interface StatementTableProps {
  unitId: string;
  from: string; // YYYY-MM
  to:   string; // YYYY-MM
}

export default function StatementTable({ unitId, from, to }: StatementTableProps) {
  const [matrix, setMatrix]   = useState<PaymentsMatrix | null>(null);
  const [items, setItems]     = useState<StatementItem[]>([]);
  const [months, setMonths]   = useState<{ month: number; year: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Načtu pivotní matici a vygeneruji 'items' pro první tabulku
  useEffect(() => {
    if (!unitId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(res => res.json())
      .then((data: { paymentsMatrix: PaymentsMatrix }) => {
        const pm = data.paymentsMatrix;
        setMatrix(pm);
        setMonths(pm.months);

        // Vygeneruji všechny položky a předvyberu ty s chargeableMonths
        const all: StatementItem[] = pm.data.map(r => {
          const unit = PREDEFINED_ITEMS.find(i => i.id === r.id)?.unit ?? 'Kč';
          const chargeableMonths = r.values
            .map((v, idx) => (typeof v === 'number' ? idx + 1 : null))
            .filter((m): m is number => m !== null);

          return {
            id: r.id,
            name: r.name,
            totalAdvance: r.total,
            consumption: '',
            unit,
            totalCost: '',
            diff: 0,
            chargeableMonths,
            manual: false,
          };
        });
        setItems(all.filter(i => i.chargeableMonths.length > 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [unitId, from, to]);

  // Pomocné funkce pro editaci
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const addItem = (itemId?: string) => {
    let base: StatementItem = {
      id: generateId(),
      name: '',
      totalAdvance: 0,
      consumption: '',
      unit: '',
      totalCost: '',
      diff: 0,
      chargeableMonths: [],
      manual: true,
    };
    if (itemId) {
      const found = PREDEFINED_ITEMS.find(i => i.id === itemId);
      if (found) base = { ...base, id: found.id, name: found.name, unit: found.unit };
    }
    setItems(a => [...a, base]);
  };
  const deleteItem = (id: string) =>
    setItems(a => a.filter(x => x.id !== id));
  const recalcDiffs = () =>
    setItems(a => a.map(item => ({
      ...item,
      diff:
        typeof item.totalAdvance === 'number' && typeof item.totalCost === 'number'
          ? item.totalAdvance - item.totalCost
          : 0,
    })));
  const updateItem = (id: string, field: keyof StatementItem, value: string | number) =>
    setItems(a => a.map(item =>
      item.id === id
        ? {
            ...item,
            [field]: value === '' ? '' : isNaN(Number(value)) ? value : Number(value),
            ...(field === 'totalCost' || field === 'totalAdvance'
              ? {
                  diff:
                    field === 'totalCost'
                      ? (item.totalAdvance as number) - Number(value)
                      : Number(value) - (item.totalCost as number),
                }
              : {}),
          }
        : item
    ));

  if (loading) return <div>Načítám…</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold">Vyúčtování za období</h1>

      {/* --- 1) První tabulka: agregované položky za celé období --- */}
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Název</th>
            <th className="p-2 border">Zálohy (Kč)</th>
            <th className="p-2 border">Spotřeba</th>
            <th className="p-2 border">Jednotka</th>
            <th className="p-2 border">Náklady (Kč)</th>
            <th className="p-2 border">Přeplatek/Nedoplatek</th>
            <th className="p-2 border">Měsíců</th>
            <th className="p-2 border">Akce</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-2 text-gray-500">
                Žádné účtované položky za období
              </td>
            </tr>
          ) : items.map(item => (
            <tr key={item.id}>
              <td className="border p-1">
                <input
                  value={item.name}
                  onChange={e => updateItem(item.id, 'name', e.target.value)}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={item.totalAdvance}
                  onChange={e => updateItem(item.id, 'totalAdvance', e.target.value)}
                  className="w-full border rounded px-1"
                  min={0}
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={item.consumption}
                  onChange={e => updateItem(item.id, 'consumption', e.target.value)}
                  className="w-full border rounded px-1"
                  min={0}
                />
              </td>
              <td className="border p-1">
                <input
                  value={item.unit}
                  onChange={e => updateItem(item.id, 'unit', e.target.value)}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={item.totalCost}
                  onChange={e => updateItem(item.id, 'totalCost', e.target.value)}
                  className="w-full border rounded px-1"
                  min={0}
                />
              </td>
              <td className="border text-center">
                <span
                  className={
                    item.diff > 0
                      ? 'text-green-700 font-bold'
                      : item.diff < 0
                      ? 'text-red-700 font-bold'
                      : ''
                  }
                >
                  {item.diff > 0 ? '+' : ''}
                  {item.diff}
                </span>
              </td>
              <td className="border text-center">
                {item.chargeableMonths.length} / {months.length}
              </td>
              <td className="border text-center">
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-red-600"
                  title="Smazat položku"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- Přidání a přepočet --- */}
      <div className="flex gap-2">
        <button
          onClick={() => addItem()}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Přidat položku
        </button>
        <button
          onClick={recalcDiffs}
          className="bg-green-700 text-white px-3 py-1 rounded"
        >
          Přepočítat přeplatky/nedoplatky
        </button>
      </div>

      {/* --- 2) Druhá tabulka: rozpis nákladů po měsících --- */}
      {matrix && (
        <div>
          <h2 className="font-semibold mt-8 mb-2">Rozpis nákladů po měsících</h2>
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Měsíc/Rok</th>
                {matrix.data.map(r => (
                  <th key={r.id} className="p-2 border text-center">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m, mi) => (
                <tr key={`${m.year}-${m.month}`}>
                  <td className="border p-1">
                    {`${String(m.month).padStart(2, '0')}/${m.year}`}
                  </td>
                  {matrix.data.map(r => {
                    const v = r.values[mi];
                    return (
                      <td key={r.id} className="border p-1 text-center">
                        {v !== '' ? v : 0}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
