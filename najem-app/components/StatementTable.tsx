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
  billableLabel?: string;
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
    fetch(`/api/statements/${unitId}?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((data: MonthlyObligation[]) => {
        const agg: Record<string, StatementItem> = {};

        for (const obligation of data) {
          for (const key of ['rent', 'electricity', 'water', 'gas', 'services', 'repair_fund']) {
            if (typeof obligation[key as keyof MonthlyObligation] === 'number') {
              const value = obligation[key as keyof MonthlyObligation] as number;
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
                agg[key].billableLabel = ' (neúčtováno v některých měsících)';
              }
            }
          }
          // --- Custom Charges ---
          if (obligation.custom_charges) {
            let customCharges: CustomCharge[] = [];
            if (typeof obligation.custom_charges === 'string') {
              try { customCharges = JSON.parse(obligation.custom_charges); } catch {}
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

  // Další logika přidávání, editace, mazání je stejná jako dřív (můžeš upravit nebo doplnit)

  // ... (viz předchozí StatementTable)

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
              <td className="border p-1">{item.name + (item.billableLabel || '')}</td>
              <td className="border p-1">{item.totalAdvance}</td>
              <td className="border p-1">{item.consumption}</td>
              <td className="border p-1">{item.unit}</td>
              <td className="border p-1">{item.totalCost}</td>
              <td className="border text-center">{item.diff}</td>
              <td className="border text-center text-xs">
                {item.chargeableMonths && item.chargeableMonths.length
                  ? `${item.chargeableMonths.length} / ${totalMonths}`
                  : ''}
                {item.note && <span title={item.note} className="ml-1 text-gray-500">🛈</span>}
              </td>
              <td className="border text-center">
                {/* ... akce na mazání, úpravu, atd. */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
