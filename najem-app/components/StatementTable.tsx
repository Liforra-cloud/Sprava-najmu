// components/StatementTable.tsx

'use client';

import { useState } from 'react';

// Typ položky vyúčtování
type StatementItem = {
  id: string;
  name: string;
  totalAdvance: number;
  consumption: number | '';
  unit: string;
  totalCost: number | '';
  diff: number;
};

// Předdefinované položky, které můžeš přidat
const PREDEFINED_ITEMS = [
  { id: 'rent', name: 'Nájem', unit: 'Kč' },
  { id: 'electricity', name: 'Elektřina', unit: 'kWh' },
  { id: 'water', name: 'Voda', unit: 'm³' },
  { id: 'gas', name: 'Plyn', unit: 'm³' },
];

// Pomocná funkce na generování náhodného ID (pro nové položky)
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Dummy data pro ukázku (v reálu načteš data za období)
const exampleData = [
  { id: 'rent', name: 'Nájem', totalAdvance: 120000, unit: 'Kč' },
  { id: 'electricity', name: 'Elektřina', totalAdvance: 8000, unit: 'kWh' },
  { id: 'water', name: 'Voda', totalAdvance: 4000, unit: 'm³' },
];

export default function StatementTable() {
  // Vnitřní stav položek
  const [items, setItems] = useState<StatementItem[]>(
    exampleData.map(item => ({
      ...item,
      consumption: '',
      totalCost: '',
      diff: 0,
    }))
  );

  // Položky, které ještě nejsou přidané
  const unusedItems = PREDEFINED_ITEMS.filter(
    i => !items.some(used => used.id === i.id)
  );

  // Přidat položku ze seznamu nebo novou
  const addItem = (itemId?: string) => {
    let base: StatementItem = { id: generateId(), name: '', totalAdvance: 0, consumption: '', unit: '', totalCost: '', diff: 0 };
    if (itemId) {
      const found = PREDEFINED_ITEMS.find(i => i.id === itemId);
      if (found) base = { ...base, id: found.id, name: found.name, unit: found.unit };
    }
    setItems(arr => [...arr, base]);
  };

  // Smazat položku
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

  // Změna pole v položce – POZOR, typ pro value je string | number!
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
                      (field === 'totalCost'
                        ? (item.totalAdvance ?? 0) - Number(value)
                        : Number(value) - (item.totalCost ?? 0)),
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

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Název</th>
            <th className="p-2 border">Zálohy (Kč)</th>
            <th className="p-2 border">Spotřeba</th>
            <th className="p-2 border">Jednotka</th>
            <th className="p-2 border">Náklady celkem (Kč)</th>
            <th className="p-2 border">Přeplatek / Nedoplatek</th>
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
        {/* Přidat položku ze seznamu */}
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
        {/* Přidat úplně novou položku */}
        <button
          onClick={() => addItem()}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Přidat novou položku
        </button>
        {/* Přepočítat rozdíly */}
        <button
          onClick={recalcDiffs}
          className="bg-green-700 text-white px-3 py-1 rounded"
        >
          Přepočítat přeplatky/nedoplatky
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        <strong>Poznámka:</strong> Zálohy jsou součtem všech plateb za sledované období. Pokud má nájemník dluh, můžeš ho vyznačit přepsáním záloh, nebo doplnit zvláštní položku.
      </div>
    </div>
  );
}

