// components/StatementTable.tsx

'use client';
import { useEffect, useState } from 'react';

///////////////////////////
// 1) Typy a pomocné
///////////////////////////

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

// Override z back-endu
type Override = {
  lease_id: string;
  year: number;
  month: number;
  charge_id: string;     // id poplatku nebo '' pro poznámku
  override_val?: number; // pokud je definováno, přepíše hodnotu
  note?: string;         // pokud je definováno, je to poznámka měsíce
};

type CellKey = `${number}-${number}-${string}`; // "YYYY-MM-id"
type MonthKey = `${number}-${number}`;          // "YYYY-MM"

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
  { id: 'rent',         name: 'Nájem',      unit: 'Kč' },
  { id: 'electricity',  name: 'Elektřina',  unit: 'kWh' },
  { id: 'water',        name: 'Voda',       unit: 'm³' },
  { id: 'gas',          name: 'Plyn',       unit: 'm³' },
  { id: 'services',     name: 'Služby',     unit: 'Kč' },
  { id: 'repair_fund',  name: 'Fond oprav', unit: 'Kč' },
];

interface StatementTableProps {
  unitId: string;
  from: string; // YYYY-MM
  to:   string; // YYYY-MM
}

///////////////////////////
// 2) Komponenta
///////////////////////////

export default function StatementTable({ unitId, from, to }: StatementTableProps) {
  const [matrix, setMatrix]       = useState<PaymentsMatrix | null>(null);
  const [items, setItems]         = useState<StatementItem[]>([]);
  const [months, setMonths]       = useState<{ month: number; year: number }[]>([]);
  const [loading, setLoading]     = useState(true);

  // upravené hodnoty a poznámky
  const [pivotValues, setPivotValues] = useState<Record<CellKey, number | ''>>({});
  const [monthNotes,  setMonthNotes]  = useState<Record<MonthKey, string>>({});

  useEffect(() => {
    if (!unitId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(res => res.json())
      .then((data: {
        paymentsMatrix: PaymentsMatrix;
        overrides: Override[];
      }) => {
        const pm        = data.paymentsMatrix;
        const overrides = data.overrides;
        setMatrix(pm);
        setMonths(pm.months);

        // 2a) Horní tabulka: StatementItems (jen ty s chargeableMonths)
        const all: StatementItem[] = pm.data.map(r => {
          const unit = PREDEFINED_ITEMS.find(i => i.id === r.id)?.unit ?? 'Kč';
          const chargeableMonths = r.values
            .map((v, idx) => (typeof v === 'number' ? idx+1 : null))
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

        // 2b) Inicializace pivotValues s přepsáním overrides
        const pv: Record<CellKey, number | ''> = {};
        pm.data.forEach(r => {
          pm.months.forEach(m => {
            const base = r.values[ pm.months.findIndex(x => x.year===m.year && x.month===m.month) ];
            const key  = `${m.year}-${m.month}-${r.id}` as CellKey;
            // hledám override_val
            const ov = overrides.find(o =>
              o.charge_id === r.id &&
              o.year      === m.year &&
              o.month     === m.month
            );
            pv[key] = ov?.override_val ?? base;
          });
        });
        setPivotValues(pv);

        // 2c) Inicializace monthNotes z overrides
        const mn: Record<MonthKey,string> = {};
        pm.months.forEach(m => {
          const key = `${m.year}-${m.month}` as MonthKey;
          // hledám první note override pro ten měsíc
          const ov = overrides.find(o =>
            o.charge_id === '' &&
            o.year      === m.year &&
            o.month     === m.month &&
            typeof o.note === 'string'
          );
          mn[key] = ov?.note ?? '';
        });
        setMonthNotes(mn);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [unitId, from, to]);

  ///////////////////////////
  // Handlery pro buňky
  ///////////////////////////

  const onPivotChange = (year: number, month: number, id: string, v: string) => {
    const key = `${year}-${month}-${id}` as CellKey;
    setPivotValues(pv => ({ ...pv, [key]: v==='' ? '' : Number(v) }));
  };
  const onPivotBlur = (year: number, month: number, id: string) => {
    const key = `${year}-${month}-${id}` as CellKey;
    const val = pivotValues[key] === '' ? 0 : pivotValues[key];
    fetch('/api/statement/new', { // nebo /api/statement/entry
      method: 'PATCH',
      body: JSON.stringify({
        leaseId: unitId,
        year, month,
        chargeId: id,
        overrideVal: val
      })
    });
  };

  const onNoteChange = (year: number, month: number, txt: string) => {
    const key = `${year}-${month}` as MonthKey;
    setMonthNotes(mn => ({ ...mn, [key]: txt }));
  };
  const onNoteBlur = (year: number, month: number) => {
    const key = `${year}-${month}` as MonthKey;
    fetch('/api/statement/new', {
      method: 'PATCH',
      body: JSON.stringify({
        leaseId: unitId,
        year, month,
        chargeId: '',
        note: monthNotes[key]
      })
    });
  };

  ///////////////////////////
  // Zbytek (horní tabulka) — beze změny
  ///////////////////////////

  const generateId = () => Math.random().toString(36).substr(2,9);
  const addItem    = (itemId?: string) => { /* ... */ };
  const deleteItem = (id: string) => { /* ... */ };
  const recalcDiffs= () => { /* ... */ };
  const updateItem = (i: string, f: keyof StatementItem, v: any) => { /* ... */ };

  if (loading) return <div>Načítám…</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-8">
      {/* … horní tabulka … */}

      {/* 2) Dolní tabulka */}
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
                const mk = `${m.year}-${m.month}` as MonthKey;
                return (
                  <tr key={mk}>
                    <td className="border p-1">{`${String(m.month).padStart(2,'0')}/${m.year}`}</td>
                    {matrix.data.map(r => {
                      const ck = `${m.year}-${m.month}-${r.id}` as CellKey;
                      return (
                        <td key={ck} className="border p-1">
                          <input
                            type="number"
                            value={pivotValues[ck]}
                            onChange={e => onPivotChange(m.year,m.month,r.id,e.target.value)}
                            onBlur={()   => onPivotBlur(m.year,m.month,r.id)}
                            className="w-full text-center"
                            min={0}
                          />
                        </td>
                      );
                    })}
                    <td className="border p-1">
                      <textarea
                        value={monthNotes[mk]}
                        onChange={e => onNoteChange(m.year,m.month,e.target.value)}
                        onBlur={()   => onNoteBlur(m.year,m.month)}
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
