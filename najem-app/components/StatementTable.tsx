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

type MonthlyObligation = {
  id: string;
  lease_id: string;
  year: number;
  month: number;
  rent: number;
  water: number;
  gas: number;
  electricity: number;
  services: number;
  repair_fund: number;
  total_due: number;
  paid_amount: number;
  debt: number;
  note?: string;
  custom_charges?: CustomCharge[] | string;
  charge_flags?: Record<string, boolean>;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _MonthlyObligationEslintFix = MonthlyObligation;

export type StatementItem = {
  id: string;
  name: string;
  totalAdvance: number;         // součet záloh
  consumption: number | '';     // spotřeba za období
  unit: string;
  totalCost: number | '';       // skutečné náklady celkem
  diff: number;                 // přeplatek/nedoplatek
  chargeableMonths?: number[];  // čísla měsíců kdy byla položka účtovaná
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
  const [items, setItems] = useState<StatementItem[]>([]);
  const [allItems, setAllItems] = useState<StatementItem[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Načti data z API ---
  useEffect(() => {
    if (!unitId) {
      setItems([]);
      setAllItems([]);
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(res => res.json())
      .then(data => {
        if (data.items && data.allCharges) {
          setItems(data.items);
          setAllItems(data.allCharges);
          setPayments(data.payments || []);
        }
        // Pokud API vrací jen pole obligations, použij svůj původní transform:
        else if (Array.isArray(data)) {
          // ...tvá původní transformace (přes agg, allAgg)
        }
        setLoading(false);
      });
  }, [unitId, from, to]);

  // --- Ostatní logika zůstává (ruční přidávání atd.) ---
  const unusedItems = PREDEFINED_ITEMS.filter(i => !items.some(row => row.id === i.id));
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
  const addItem = (itemId?: string) => {
    let base: StatementItem = {
      id: generateId(), name: '', totalAdvance: 0, consumption: '', unit: '', totalCost: '', diff: 0, chargeableMonths: [], manual: true
    };
    if (itemId) {
      const found = PREDEFINED_ITEMS.find(i => i.id === itemId);
      if (found) base = { ...base, id: found.id, name: found.name, unit: found.unit, manual: false };
    }
    setItems(arr => [...arr, base]);
  };
  const deleteItem = (id: string) => {
    setItems(arr => arr.filter(item => item.id !== id));
  };
  const recalcDiffs = () => {
    setItems(arr =>
      arr.map(item => ({
        ...item,
        diff:
          typeof item.totalCost === 'number' && typeof item.totalAdvance === 'number'
            ? (item.totalAdvance ?? 0) - (item.totalCost ?? 0)
            : 0,
      }))
    );
  };
  const updateItem = (id: string, field: keyof StatementItem, value: string | number) => {
    setItems(arr =>
      arr.map(item =>
        item.id === id
          ? {
              ...item,
              [field]: value === '' ? '' : isNaN(Number(value)) ? value : Number(value),
              ...(field === 'totalCost' || field === 'totalAdvance'
                ? {
                    diff:
                      (typeof (field === 'totalCost' ? item.totalAdvance : value) === 'number' &&
                        typeof (field === 'totalCost' ? value : item.totalCost) === 'number')
                        ? (field === 'totalCost'
                            ? (item.totalAdvance as number) - (value as number)
                            : (value as number) - (item.totalCost as number))
                        : 0,
                  }
                : {}),
            }
          : item
      )
    );
  };

  if (loading) return <div>Načítám...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold mb-2">Vyúčtování za období</h1>

      {/* Tabulka jen účtovaných položek */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Název</th>
            <th className="p-2 border">Zálohy (Kč)</th>
            <th className="p-2 border">Spotřeba</th>
            <th className="p-2 border">Jednotka</th>
            <th className="p-2 border">Náklady celkem (Kč)</th>
            <th className="p-2 border">Přeplatek / Nedoplatek</th>
            <th className="p-2 border">Účtováno měsíců</th>
            <th className="p-2 border">Akce</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-gray-400 py-2">
                Žádné účtované položky za období.
              </td>
            </tr>
          )}
          {items.map(item => (
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
              <td className="border text-center text-xs">
                {item.chargeableMonths && item.chargeableMonths.length
                  ? `${item.chargeableMonths.length} / 12`
                  : ''}
                {item.note && <span title={item.note} className="ml-1 text-gray-500">🛈</span>}
              </td>
              <td className="border text-center">
                <button
                  onClick={() => deleteItem(item.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  title="Smazat"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pod tabulkou - všechny možné položky, které můžeš přidat */}
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Možné položky k přidání</h2>
        <div className="flex gap-2 flex-wrap">
          {unusedItems.length > 0 && (
            <div>
              <label>Přidat existující položku: </label>
              <select
                onChange={e => {
                  if (e.target.value) addItem(e.target.value);
                }}
                defaultValue=""
                className="border rounded p-1"
              >
                <option value="">-- vyberte --</option>
                {unusedItems.map(item => (
                  <option key={item?.id ?? ''} value={item?.id ?? ''}>
                    {item?.name ?? ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => addItem()}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Přidat novou položku
          </button>
          <button
            onClick={recalcDiffs}
            className="bg-green-700 text-white px-3 py-1 rounded"
          >
            Přepočítat přeplatky/nedoplatky
          </button>
        </div>
        {/* Přehled všech (účtovaných i neúčtovaných) pod tabulkou */}
        <div className="mt-4 text-sm">
          <b>Přehled všech poplatků za období:</b>
          <ul className="grid grid-cols-2 gap-x-4 list-disc ml-4">
            {allItems.map(row => (
              <li key={row.id}>
                {row.name}: <b>{row.totalAdvance}</b> {row.unit} (účtováno v {row.chargeableMonths?.length ?? 0} měsících)
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Výpis všech plateb za období */}
      {payments.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-2">Všechny platby v období</h2>
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="p-2 border">Měsíc/Rok</th>
                <th className="p-2 border">Zaplaceno (Kč)</th>
                <th className="p-2 border">Předpis (Kč)</th>
                <th className="p-2 border">Poznámka</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((row, i) => (
                <tr key={i}>
                  <td className="border p-1">{`${row.month}.${row.year}`}</td>
                  <td className="border p-1">{row.paid_amount}</td>
                  <td className="border p-1">{row.total_due}</td>
                  <td className="border p-1">{row.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <strong>Poznámka:</strong> Zálohy jsou součtem všech plateb za sledované období. Pokud má nájemník dluh, můžeš ho vyznačit přepsáním záloh nebo doplnit zvláštní položku.<br />
        Pokud položka nebyla účtovaná v některých měsících, je to vyznačeno ikonou 🛈.
      </div>
    </div>
  );
}
