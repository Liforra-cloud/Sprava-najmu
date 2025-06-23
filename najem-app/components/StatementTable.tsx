// components/StatementTable.tsx

'use client';

import { useEffect, useState } from 'react';

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

type StatementItem = {
  id: string;
  name: string;
  totalAdvance: number;
  consumption: number | '';
  unit: string;
  totalCost: number | '';
  diff: number;
  chargeableMonths?: number[];
  note?: string;
  manual?: boolean;
  billableLabel?: string; // pro příznak (neúčtováno)
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

// pomocná funkce na počet měsíců v období
function getMonthCount(from: string, to: string) {
  const [fromY, fromM] = from.split('-').map(Number);
  const [toY, toM] = to.split('-').map(Number);
  return (toY - fromY) * 12 + (toM - fromM) + 1;
}

export default function StatementTable({ unitId, from, to }: StatementTableProps) {
  const [items, setItems] = useState<StatementItem[]>([]);
  const [loading, setLoading] = useState(true);

  const totalMonths = getMonthCount(from, to);

  // --- Načti data z API ---
  useEffect(() => {
    setLoading(true);
    fetch(`/api/units/${unitId}/statement?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((data: MonthlyObligation[]) => {
        const agg: Record<string, StatementItem> = {};

        for (const obligation of data) {
          // --- Každá položka zvlášť ---
          for (const key of ['rent', 'electricity', 'water', 'gas', 'services', 'repair_fund']) {
            if (typeof obligation[key as keyof MonthlyObligation] === 'number') {
              const value = obligation[key as keyof MonthlyObligation] as number;
              // --- Účtováno? ---
              const billable =
                obligation.charge_flags && obligation.charge_flags[getFlagKey(key)] !== undefined
                  ? obligation.charge_flags[getFlagKey(key)]
                  : true;

              if (!agg[key]) {
                const predefined = PREDEFINED_ITEMS.find((i) => i.id === key);
                agg[key] = {
                  id: key,
                  name: predefined?.name || key,
                  unit: predefined?.unit || '',
                  totalAdvance: 0,
                  consumption: '',
                  totalCost: '',
                  diff: 0,
                  chargeableMonths: [],
                  billableLabel: '',
                };
              }
              if (billable) {
                agg[key].totalAdvance += value;
                agg[key].chargeableMonths?.push(obligation.month);
              } else {
                // Pokud existuje neúčtovaný měsíc, nastav příznak
                agg[key].billableLabel = ' (neúčtováno v některých měsících)';
              }
            }
          }
          // --- Custom Charges (účtovatelné) ---
          if (obligation.custom_charges) {
            let customCharges: CustomCharge[] = [];
            if (typeof obligation.custom_charges === 'string') {
              try {
                customCharges = JSON.parse(obligation.custom_charges);
              } catch {}
            } else {
              customCharges = obligation.custom_charges;
            }
            for (const charge of customCharges) {
              if (!charge) continue;
              const billable = charge.billable ?? charge.enabled;
              const key = `custom_${charge.name}`;
              if (!agg[key]) {
                agg[key] = {
                  id: key,
                  name: charge.name,
                  unit: '',
                  totalAdvance: 0,
                  consumption: '',
                  totalCost: '',
                  diff: 0,
                  chargeableMonths: [],
                  billableLabel: '',
                };
              }
              if (billable) {
                agg[key].totalAdvance += Number(charge.amount || 0);
                agg[key].chargeableMonths?.push(obligation.month);
              } else {
                agg[key].billableLabel = ' (neúčtováno v některých měsících)';
              }
            }
          }
        }
        setItems(Object.values(agg));
        setLoading(false);
      });
  }, [unitId, from, to]);

  // --- Ostatní logika (ruční přidávání, editace, atd.) ---
  // Najdi PREDEFINED položky, které nejsou plně účtované (nebo vůbec)
const unusedItems = PREDEFINED_ITEMS
  .map(predef => {
    const existing = items.find(row => row.id === predef.id);
    if (!existing) return predef;
    if (
      existing.chargeableMonths &&
      existing.chargeableMonths.length >= totalMonths
    ) {
      return null;
    }
    return { ...predef, name: predef.name + ' (neúčtováno)' };
  })
  .filter((item): item is { id: string; name: string; unit: string } => !!item);



  

  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
  const addItem = (itemId?: string) => {
    let base: StatementItem = {
      id: generateId(), name: '', totalAdvance: 0, consumption: '', unit: '', totalCost: '', diff: 0, chargeableMonths: [], manual: true
    };
    if (itemId) {
      const found = PREDEFINED_ITEMS.find(i => i.id === itemId.replace(' (neúčtováno)', ''));
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

  function getFlagKey(key: string) {
    switch (key) {
      case 'rent': return 'rent_amount';
      case 'water': return 'monthly_water';
      case 'gas': return 'monthly_gas';
      case 'electricity': return 'monthly_electricity';
      case 'services': return 'monthly_services';
      case 'repair_fund': return 'repair_fund';
      default: return key;
    }
  }

  if (loading) return <div>Načítám...</div>;

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
            <th className="p-2 border">Účtováno měsíců</th>
            <th className="p-2 border">Akce</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td className="border p-1">
                <input
                  value={item.name + (item.billableLabel || '')}
                  onChange={e => updateItem(item.id, 'name', e.target.value.replace(/ \(neúčtováno.*\)$/, ''))}
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
                  ? `${item.chargeableMonths.length} / ${totalMonths}`
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
