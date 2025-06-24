// components/StatementTable.tsx

'use client';
import { useEffect, useState } from 'react';

// --- Typy z API ---
type CustomCharge = {
  name: string;
  amount: number;
  billable?: boolean;
  enabled?: boolean;
};

type Payment = {
  month: number;
  year: number;
  paid_amount: number;
  total_due: number;
  note?: string | null;
  custom_charges?: CustomCharge[] | string;
  charge_flags?: Record<string, boolean>;
};

// Jeden řádek pivotní matice
type MatrixRow = {
  id: string;
  name: string;
  values: (number | '')[];
  total: number;
};
// Pivotní matice vrácená z API
type PaymentsMatrix = {
  months: { month: number; year: number }[];
  data: MatrixRow[];
};

export type StatementItem = {
  id: string;
  name: string;
  totalAdvance: number;
  consumption: number | '';
  unit: string;
  totalCost: number | '';
  diff: number;
  chargeableMonths: number[];
  note?: string;
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
  to: string;   // YYYY-MM
}

export default function StatementTable({ unitId, from, to }: StatementTableProps) {
  const [matrix, setMatrix] = useState<PaymentsMatrix | null>(null);
  const [items, setItems] = useState<StatementItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [months, setMonths] = useState<{ month: number; year: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(res => res.json())
      .then((data: { paymentsMatrix: PaymentsMatrix; payments?: Payment[] }) => {
        const pm = data.paymentsMatrix;
        setMatrix(pm);
        setMonths(pm.months);

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
        setPayments(data.payments ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [unitId, from, to]);

  const paymentLabels = Array.from(new Set(payments.map(p => p.note ?? 'Platba')));
  const paymentRows = paymentLabels.map(label => {
    const values = months.map(({ month, year }) => {
      const p = payments.find(x => (x.note ?? 'Platba') === label && x.month === month && x.year === year);
      return p ? p.paid_amount : '';
    });
    const total = values.reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
    return { label, values, total };
  });

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
      if (found) base = { ...base, id: found.id, name: found.name, unit: found.unit, manual: false };
    }
    setItems(a => [...a, base]);
  };

  const deleteItem = (id: string) => setItems(a => a.filter(x => x.id !== id));

  const recalcDiffs = () => setItems(a =>
    a.map(item => ({
      ...item,
      diff: (typeof item.totalAdvance === 'number' && typeof item.totalCost === 'number')
        ? item.totalAdvance - item.totalCost
        : 0
    }))
  );

  const updateItem = (id: string, field: keyof StatementItem, value: string | number) =>
    setItems(a => a.map(item =>
      item.id === id
        ? {
            ...item,
            [field]: value === '' ? '' : isNaN(Number(value)) ? value : Number(value),
            ...(field === 'totalCost' || field === 'totalAdvance'
              ? {
                  diff: field === 'totalCost'
                    ? (item.totalAdvance as number) - Number(value)
                    : Number(value) - (item.totalCost as number)
                }
              : {}),
          }
        : item
    ));

  if (loading) return <div>Načítám…</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold">Vyúčtování za období</h1>

      {matrix && (
        <div>
          <h2 className="font-semibold mb-2">Souhrn poplatků</h2>
          <table className="min-w-full border text-sm mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Poplatek</th>
                {months.map(m => (
                  <th key={`${m.year}-${m.month}`} className="p-2 border">
                    {`${String(m.month).padStart(2,'0')}/${m.year}`}
                  </th>
                ))}
                <th className="p-2 border">Celkem</th>
              </tr>
            </thead>
            <tbody>
              {matrix.data.map(r => (
                <tr key={r.id}>
                  <td className="border p-1 font-medium">{r.name}</td>
                  {r.values.map((v, i) => (
                    <td key={i} className="border p-1 text-center">{v !== '' ? v : ''}</td>
                  ))}
                  <td className="border p-1 text-center font-bold">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
              <td className="border p-1"><input value={item.name}
                onChange={e => updateItem(item.id,'name',e.target.value)}
                className="w-full border rounded px-1" /></td>
              <td className="border p-1"><input type="number" value={item.totalAdvance}
                onChange={e => updateItem(item.id,'totalAdvance',e.target.value)}
                className="w-full border rounded px-1" min={0} /></td>
              <td className="border p-1"><input type="number" value={item.consumption}
                onChange={e => updateItem(item.id,'consumption',e.target.value)}
                className="w-full border rounded px-1" min={0} /></td>
              <td className="border p-1"><input value={item.unit}
                onChange={e => updateItem(item.id,'unit',e.target.value)}
                className="w-full border rounded px-1" /></td>
              <td className="border p-1"><input type="number" value={item.totalCost}
                onChange={e => updateItem(item.id,'totalCost',e.target.value)}
                className="w-full border rounded px-1" min={0} /></td>
              <td className="border text-center">
                <span className={item.diff>0?'text-green-700 font-bold': item.diff<0?'text-red-700 font-bold':''}>
                  {item.diff>0?'+':''}{item.diff}
                </span>
              </td>
              <td className="border text-center">{item.chargeableMonths.length} / {months.length}</td>
              <td className="border text-center">
                <button onClick={() => deleteItem(item.id)} className="text-red-600">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {paymentRows.length > 0 && (
        <div>
          <h2 className="font-semibold mt-6 mb-2">Soupis plateb</h2>
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Platba</th>
                {months.map(m => (
                  <th key={`${m.year}-${m.month}`} className="p-2 border">
                    {`${String(m.month).padStart(2,'0')}/${m.year}`}
                  </th>
                ))}
                <th className="p-2 border">Celkem</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.map(row => (
                <tr key={row.label}>
                  <td className="border p-1 font-medium">{row.label}</td>
                  {row.values.map((v,i) => (
                    <td key={i} className="border p-1 text-center">{v!==''?v:''}</td>
                  ))}
                  <td className="border p-1 text-center font-bold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button onClick={() => addItem()} className="bg-blue-600 text-white px-3 py-1 rounded">Přidat položku</button>
        <button onClick={recalcDiffs} className="bg-green-700 text-white px-3 py-1 rounded">Přepočítat Δ</button>
      </div>
    </div>
  );
}
