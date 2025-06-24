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

// --- Typ pro editovanou buňku ---
type CellKey = `${number}-${number}-${string}`; // "YYYY-MM-id"

// --- První tabulka: StatementItem ---
export type StatementItem = {
  id: string;
  name: string;
  totalAdvance: number;
  consumption: number | '';
  unit: string;
  totalCost: number | '';
  diff: number;
  chargeableMonths: number[];
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
  const [matrix, setMatrix]         = useState<PaymentsMatrix | null>(null);
  const [items, setItems]           = useState<StatementItem[]>([]);
  const [months, setMonths]         = useState<{ month: number; year: number }[]>([]);
  const [loading, setLoading]       = useState(true);

  // pro editaci pivotních buněk
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({});
  const [monthNotes, setMonthNotes]   = useState<Record<`${number}-${number}`, string>>({});

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

        // StatementItems pro horní tabulku
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

        // Inicializace pivotValues
        const pv: Record<CellKey, number | ''> = {};
        pm.data.forEach(r => {
          pm.months.forEach((m, mi) => {
            const key = `${m.year}-${m.month}-${r.id}` as CellKey;
            pv[key] = r.values[mi];
          });
        });
        setPivotValues(pv);

        // Inicializace prázdných poznámek
        const mn: Record<`${number}-${number}`, string> = {};
        pm.months.forEach(m => {
          mn[`${m.year}-${m.month}`] = '';
        });
        setMonthNotes(mn);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [unitId, from, to]);

  // Handlery pro pivotní buňky
  const onPivotChange = (year: number, month: number, id: string, value: string) => {
    const key = `${year}-${month}-${id}` as CellKey;
    setPivotValues(pv => ({
      ...pv,
      [key]: value === '' ? '' : Number(value),
    }));
  };

  const onNoteChange = (year: number, month: number, text: string) => {
    const key = `${year}-${month}` as `${number}-${number}`;
    setMonthNotes(mn => ({
      ...mn,
      [key]: text,
    }));
  };

  // Pomocné pro první tabulku
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const addItem = (itemId?: string) => {
    let base: StatementItem = {
      id: generateId(), name: '', totalAdvance: 0,
      consumption: '', unit: '', totalCost: '',
      diff: 0, chargeableMonths: [], manual: true,
    };
    if (itemId) {
      const f = PREDEFINED_ITEMS.find(i => i.id === itemId);
      if (f) base = { ...base, id: f.id, name: f.name, unit: f.unit };
    }
    setItems(a => [...a, base]);
  };
  const deleteItem = (id: string) => setItems(a => a.filter(x => x.id !== id));
  const recalcDiffs = () => setItems(a => a.map(item => ({
    ...item,
    diff:
      typeof item.totalAdvance === 'number' && typeof item.totalCost === 'number'
        ? item.totalAdvance - item.totalCost
        : 0
  })));
  const updateItem = (id: string, field: keyof StatementItem, val: string | number) =>
    setItems(a => a.map(item =>
      item.id === id
        ? {
            ...item,
            [field]: val === '' ? '' : isNaN(Number(val)) ? val : Number(val),
            ...(field === 'totalCost' || field === 'totalAdvance'
              ? { diff:
                  field === 'totalCost'
                    ? (item.totalAdvance as number) - Number(val)
                    : Number(val) - (item.totalCost as number)
                }
              : {}),
          }
        : item
    ));

  if (loading) return <div>Načítám…</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold">Vyúčtování za období</h1>

      {/* 1) Horní tabulka – agregované položky */}
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Název</th>
            <th className="p-2 border">Zálohy</th>
            <th className="p-2 border">Spotřeba</th>
            <th className="p-2 border">Jednotka</th>
            <th className="p-2 border">Náklady</th>
            <th className="p-2 border">Δ</th>
            <th className="p-2 border">Měsíců</th>
            <th className="p-2 border">Akce</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-2 text-gray-500">Žádné položky</td></tr>
          ) : items.map(item => (
            <tr key={item.id}>
              <td className="border p-1">
                <input
                  value={item.name}
                  onChange={e => updateItem(item.id,'name',e.target.value)}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={item.totalAdvance}
                  onChange={e => updateItem(item.id,'totalAdvance',e.target.value)}
                  className="w-full border rounded px-1" min={0}
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={item.consumption}
                  onChange={e => updateItem(item.id,'consumption',e.target.value)}
                  className="w-full border rounded px-1" min={0}
                />
              </td>
              <td className="border p-1">
                <input
                  value={item.unit}
                  onChange={e => updateItem(item.id,'unit',e.target.value)}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={item.totalCost}
                  onChange={e => updateItem(item.id,'totalCost',e.target.value)}
                  className="w-full border rounded px-1" min={0}
                />
              </td>
              <td className="border text-center">
                <span className={
                  item.diff>0?'text-green-700 font-bold':
                  item.diff<0?'text-red-700 font-bold':''}
                >
                  {item.diff>0?'+':''}{item.diff}
                </span>
              </td>
              <td className="border text-center">
                {item.chargeableMonths.length} / {months.length}
              </td>
              <td className="border text-center">
                <button onClick={() => deleteItem(item.id)} className="text-red-600">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <button onClick={() => addItem()} className="bg-blue-600 text-white px-3 py-1 rounded">Přidat položku</button>
        <button onClick={recalcDiffs} className="bg-green-700 text-white px-3 py-1 rounded">Přepočítat Δ</button>
      </div>

      {/* 2) Dolní tabulka – rozpis po měsících s editací a poznámkou */}
      {matrix && (
        <div>
          <h2 className="font-semibold mt-8 mb-2">Rozpis nákladů po měsících</h2>
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Měsíc/Rok</th>
                {matrix.data.map(r => (
                  <th key={r.id} className="p-2 border text-center">{r.name}</th>
                ))}
                <th className="p-2 border">Poznámka</th>
              </tr>
            </thead>
            <tbody>
           {months.map(m => {
                const monthKey = `${m.year}-${m.month}` as `${number}-${number}`;
                return (
                  <tr key={monthKey}>
                    <td className="border p-1">{`${String(m.month).padStart(2,'0')}/${m.year}`}</td>
                    {matrix.data.map(r => {
                      const cellKey = `${m.year}-${m.month}-${r.id}` as CellKey;
                      return (
                        <td key={cellKey} className="border p-1">
                          <input
                            type="number"
                            value={pivotValues[cellKey]}
                            onChange={e => onPivotChange(m.year, m.month, r.id, e.target.value)}
                            className="w-full text-center"
                            min={0}
                          />
                        </td>
                      );
                    })}
                    <td className="border p-1">
                      <textarea
                        value={monthNotes[monthKey]}
                        onChange={e => onNoteChange(m.year, m.month, e.target.value)}
                        className="w-full border rounded px-1 py-1"
                        rows={2}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
