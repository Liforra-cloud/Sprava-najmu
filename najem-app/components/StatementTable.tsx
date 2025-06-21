// components/StatementTable.tsx

'use client';

import { useState } from 'react';

// Typ položky vyúčtování
type StatementItem = {
  id: string;
  name: string;
  totalAdvance: number;         // součet záloh
  consumption: number | '';     // spotřeba za období
  unit: string;
  totalCost: number | '';       // skutečné náklady celkem
  diff: number;                 // přeplatek/nedoplatek
  chargeableMonths?: number[];  // čísla měsíců kdy byla položka účtovaná
  note?: string;
  manual?: boolean;             // ručně přidaná položka
};

// Každý lease za období (první návrh, v praxi ti to přichází z API)
type LeasePeriod = {
  leaseId: string;
  tenant: string;
  from: string; // např. "2024-01-01"
  to: string;   // např. "2024-05-31"
  months: number[]; // například [1,2,3,4,5] - leden až květen
};

// Ukázkové lease periody (nahraď fetchnutými z DB!)
const leases: LeasePeriod[] = [
  { leaseId: '1', tenant: 'Karel Novák', from: '2024-01-01', to: '2024-05-31', months: [1,2,3,4,5] },
  { leaseId: '2', tenant: 'Jana Malá',   from: '2024-06-01', to: '2024-12-31', months: [6,7,8,9,10,11,12] }
];

// Předdefinované typy položek
const PREDEFINED_ITEMS = [
  { id: 'rent', name: 'Nájem', unit: 'Kč' },
  { id: 'electricity', name: 'Elektřina', unit: 'kWh' },
  { id: 'water', name: 'Voda', unit: 'm³' },
  { id: 'gas', name: 'Plyn', unit: 'm³' },
  { id: 'internet', name: 'Internet', unit: 'Kč' }
];

// Dummy data pro ukázku – v reálu to budeš plnit např. v mapě: položka -> sum(advance za období napříč leases)
const exampleData: StatementItem[] = [
  {
    id: 'rent', name: 'Nájem', totalAdvance: 120000, unit: 'Kč', consumption: '', totalCost: '', diff: 0,
    chargeableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
  },
  {
    id: 'electricity', name: 'Elektřina', totalAdvance: 9000, unit: 'kWh', consumption: '', totalCost: '', diff: 0,
    chargeableMonths: [1,2,3,4,5,7,8,9,10,11,12], // v červnu nebyla účtovaná!
    note: 'V červnu nebyla účtováno'
  },
  {
    id: 'internet', name: 'Internet', totalAdvance: 3600, unit: 'Kč', consumption: '', totalCost: '', diff: 0,
    chargeableMonths: [6,7,8,9,10,11,12]
  }
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function StatementTable() {
  const [items, setItems] = useState<StatementItem[]>(exampleData);

  // Které položky ještě nejsou v tabulce
  const unusedItems = PREDEFINED_ITEMS.filter(i => !items.some(row => row.id === i.id));

  // Přidání nové položky (existující nebo nová)
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

  // Smazání položky
  const deleteItem = (id: string) => {
    setItems(arr => arr.filter(item => item.id !== id));
  };

  // Přepočet přeplatků/nedoplatků
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

  // Změna pole v řádku
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

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold mb-2">Vyúčtování za období</h1>

      {/* Přehled období a všech nájemců */}
      <div className="mb-4">
        <span className="font-semibold">Období: </span> 01/2024 – 12/2024 <br />
        <span className="font-semibold">Smlouvy v období: </span>
        {leases.map(l => (
          <span key={l.leaseId} className="mr-4">
            {l.from} – {l.to} (<b>{l.tenant}</b>)
          </span>
        ))}
      </div>

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

      {/* Pod tabulkou */}
      <div className="flex gap-2 mt-4 flex-wrap">
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
                <option key={item.id} value={item.id}>
                  {item.name}
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
      <div className="mt-4 text-sm text-gray-500">
        <strong>Poznámka:</strong> Zálohy jsou součtem všech plateb za sledované období. Pokud má nájemník dluh, můžeš ho vyznačit přepsáním záloh nebo doplnit zvláštní položku.<br />
        Pokud položka nebyla účtovaná v některých měsících, je to vyznačeno ikonou 🛈.
      </div>
    </div>
  );
}
