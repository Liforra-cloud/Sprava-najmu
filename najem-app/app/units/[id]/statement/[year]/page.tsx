// app/units/[id]/statement/[year]/page.tsx

'use client';

import { useState } from 'react';

type StatementItem = {
  id: string;
  name: string;
  type: 'účtovatelné' | 'neúčtovatelné';
  advance: number;
  consumption?: number;
  unit?: string;
  unit_price?: number;
  actual_price: number;
  chargeable: boolean;
};

type Payment = {
  id: string;
  date: string;
  amount: number;
  type: string;
  note?: string;
};

type StatementData = {
  items: StatementItem[];
  payments: Payment[];
};

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function StatementPage({ params }: { params: { id: string; year: string } }) {
  // const { id, year } = params; // id není využité, můžeš použít později na fetch
  const { year } = params;

  const [data, setData] = useState<StatementData>({
    items: [
      {
        id: 'rent',
        name: 'Nájem',
        type: 'účtovatelné',
        advance: 60000,
        actual_price: 60000,
        chargeable: true,
      },
      {
        id: 'electricity',
        name: 'Elektřina',
        type: 'účtovatelné',
        advance: 3000,
        consumption: 2850,
        unit: 'kWh',
        unit_price: 4.5,
        actual_price: 2850 * 4.5,
        chargeable: true,
      },
      {
        id: 'internet',
        name: 'Internet',
        type: 'neúčtovatelné',
        advance: 0,
        consumption: 1,
        unit: 'ks',
        unit_price: 450,
        actual_price: 450,
        chargeable: false,
      },
    ],
    payments: [
      { id: 'p1', date: '2024-01-03', amount: 10000, type: 'Nájem', note: '' },
      { id: 'p2', date: '2024-01-10', amount: 1000, type: 'Elektřina', note: '' },
      { id: 'p3', date: '2024-02-10', amount: 2000, type: 'Nájem', note: 'druhá platba' },
    ],
  });

  const totalAdvance = data.items.filter(i => i.chargeable).reduce((sum, i) => sum + i.advance, 0);
  const totalActual = data.items.filter(i => i.chargeable).reduce((sum, i) => sum + i.actual_price, 0);
  const totalDiff = totalAdvance - totalActual;

  const updateItem = (id: string, update: Partial<StatementItem>) => {
    setData(d => ({
      ...d,
      items: d.items.map(i => (i.id === id ? { ...i, ...update } : i)),
    }));
  };

  const deleteItem = (id: string) => {
    setData(d => ({
      ...d,
      items: d.items.filter(i => i.id !== id),
    }));
  };

  const addItem = () => {
    setData(d => ({
      ...d,
      items: [
        ...d.items,
        {
          id: generateId(),
          name: '',
          type: 'účtovatelné',
          advance: 0,
          actual_price: 0,
          chargeable: true,
        },
      ],
    }));
  };

  const updatePayment = (id: string, update: Partial<Payment>) => {
    setData(d => ({
      ...d,
      payments: d.payments.map(p => (p.id === id ? { ...p, ...update } : p)),
    }));
  };

  const deletePayment = (id: string) => {
    setData(d => ({
      ...d,
      payments: d.payments.filter(p => p.id !== id),
    }));
  };

  const addPayment = () => {
    setData(d => ({
      ...d,
      payments: [
        ...d.payments,
        { id: generateId(), date: '', amount: 0, type: '', note: '' },
      ],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold mb-2">Vyúčtování za období {year}</h1>
      <div className="space-y-2">
        <div>
          <strong>Zaplacené zálohy (účtovatelné):</strong> {totalAdvance.toLocaleString()} Kč
        </div>
        <div>
          <strong>Skutečné náklady (účtovatelné):</strong> {totalActual.toLocaleString()} Kč
        </div>
        <div>
          <strong>Přeplatek / Nedoplatek:</strong>{" "}
          <span className={totalDiff >= 0 ? "text-green-700" : "text-red-700"}>
            {totalDiff.toLocaleString()} Kč
          </span>
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-6">Položky vyúčtování</h2>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Název</th>
            <th className="p-2 border">Typ</th>
            <th className="p-2 border">Zálohy</th>
            <th className="p-2 border">Spotřeba/jednotky</th>
            <th className="p-2 border">Jednotka</th>
            <th className="p-2 border">Cena/jedn.</th>
            <th className="p-2 border">Skutečnost</th>
            <th className="p-2 border">Účtovat</th>
            <th className="p-2 border">Akce</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map(item => (
            <tr key={item.id}>
              <td className="border p-1">
                <input
                  value={item.name}
                  onChange={e => updateItem(item.id, { name: e.target.value })}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <select
                  value={item.type}
                  onChange={e =>
                    updateItem(item.id, {
                      type: e.target.value === 'účtovatelné' ? 'účtovatelné' : 'neúčtovatelné',
                    })
                  }
                  className="border rounded"
                >
                  <option value="účtovatelné">účtovatelné</option>
                  <option value="neúčtovatelné">neúčtovatelné</option>
                </select>
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={item.advance}
                  onChange={e => updateItem(item.id, { advance: Number(e.target.value) })}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={item.consumption ?? ''}
                  onChange={e => {
                    const v = Number(e.target.value);
                    updateItem(item.id, {
                      consumption: v,
                      actual_price:
                        v && item.unit_price
                          ? v * (item.unit_price ?? 0)
                          : item.actual_price,
                    });
                  }}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  value={item.unit ?? ''}
                  onChange={e => updateItem(item.id, { unit: e.target.value })}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={item.unit_price ?? ''}
                  onChange={e => {
                    const v = Number(e.target.value);
                    updateItem(item.id, {
                      unit_price: v,
                      actual_price:
                        item.consumption && v
                          ? item.consumption * v
                          : item.actual_price,
                    });
                  }}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={item.actual_price}
                  onChange={e => updateItem(item.id, { actual_price: Number(e.target.value) })}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border text-center">
                <input
                  type="checkbox"
                  checked={item.chargeable}
                  onChange={e => updateItem(item.id, { chargeable: e.target.checked })}
                />
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
        <tfoot>
          <tr>
            <td colSpan={9}>
              <button
                onClick={addItem}
                className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
              >
                Přidat položku
              </button>
            </td>
          </tr>
        </tfoot>
      </table>

      <h2 className="text-lg font-semibold mt-6">Platby za období</h2>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Datum</th>
            <th className="p-2 border">Částka</th>
            <th className="p-2 border">Typ</th>
            <th className="p-2 border">Poznámka</th>
            <th className="p-2 border">Akce</th>
          </tr>
        </thead>
        <tbody>
          {data.payments.map(payment => (
            <tr key={payment.id}>
              <td className="border p-1">
                <input
                  type="date"
                  value={payment.date}
                  onChange={e => updatePayment(payment.id, { date: e.target.value })}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  value={payment.amount}
                  onChange={e => updatePayment(payment.id, { amount: Number(e.target.value) })}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  value={payment.type}
                  onChange={e => updatePayment(payment.id, { type: e.target.value })}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  value={payment.note ?? ''}
                  onChange={e => updatePayment(payment.id, { note: e.target.value })}
                  className="w-full border rounded px-1"
                />
              </td>
              <td className="border text-center">
                <button
                  onClick={() => deletePayment(payment.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  title="Smazat"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5}>
              <button
                onClick={addPayment}
                className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
              >
                Přidat platbu
              </button>
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="flex gap-4 mt-6">
        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Uložit změny
        </button>
        <button className="bg-gray-700 text-white px-4 py-2 rounded">
          Exportovat do PDF
        </button>
      </div>
    </div>
  );
}
