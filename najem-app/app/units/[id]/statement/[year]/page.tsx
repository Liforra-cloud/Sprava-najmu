//units/[id]/statement/[year]/page.tsx

'use client';
import { useEffect, useState } from 'react';

interface CustomCharge {
  name: string;
  amount: number;
  billable?: boolean;
  enabled?: boolean;
}
interface StatementRow {
  month: number;
  rent: number;
  services: number;
  water: number;
  gas: number;
  electricity: number;
  repair_fund: number;
  custom_charges: CustomCharge[];
  total_due: number;
  paid_amount: number;
  debt: number;
}

export default function StatementPage({ params }: { params: { id: string, year: string } }) {
  const { id, year } = params;
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/units/${id}/statement/${year}`)
      .then(res => res.json())
      .then(data => {
        setRows(data.obligations.map((ob: any) => ({
          ...ob,
          custom_charges: typeof ob.custom_charges === "string"
            ? JSON.parse(ob.custom_charges || "[]")
            : ob.custom_charges || []
        })));
        setIsLoading(false);
      });
  }, [id, year]);

  // Year summary:
  const sum = (key: keyof StatementRow) =>
    rows.reduce((acc, r) => acc + (r[key] || 0), 0);

  // Sum of all allowed custom charges:
  const customTotal = rows.reduce((acc, r) =>
    acc + (r.custom_charges || []).filter(c => c.enabled || c.billable)
      .reduce((sum, c) => sum + (typeof c.amount === "number" ? c.amount : Number(c.amount)), 0)
  , 0);

  if (isLoading) return <div>Loading statement…</div>;

  return (
    <div className="max-w-3xl mx-auto my-10 bg-white rounded shadow p-6">
      <h1 className="text-2xl font-bold mb-4">Statement for {year}</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>Month</th>
            <th>Rent</th>
            <th>Services</th>
            <th>Water</th>
            <th>Gas</th>
            <th>Electricity</th>
            <th>Repair fund</th>
            <th>Custom charges</th>
            <th>Total due</th>
            <th>Paid</th>
            <th>Debt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="text-center">
              <td>{r.month}</td>
              <td>{r.rent ?? 0} Kč</td>
              <td>{r.services ?? 0} Kč</td>
              <td>{r.water ?? 0} Kč</td>
              <td>{r.gas ?? 0} Kč</td>
              <td>{r.electricity ?? 0} Kč</td>
              <td>{r.repair_fund ?? 0} Kč</td>
              <td>
                {(r.custom_charges || []).filter(c => c.enabled || c.billable).map((c, ci) =>
                  <div key={ci}>{c.name}: {c.amount} Kč</div>
                )}
              </td>
              <td>{r.total_due ?? 0} Kč</td>
              <td>{r.paid_amount ?? 0} Kč</td>
              <td>{r.debt ?? 0} Kč</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-bold">
            <td>Total</td>
            <td>{sum('rent')} Kč</td>
            <td>{sum('services')} Kč</td>
            <td>{sum('water')} Kč</td>
            <td>{sum('gas')} Kč</td>
            <td>{sum('electricity')} Kč</td>
            <td>{sum('repair_fund')} Kč</td>
            <td>{customTotal} Kč</td>
            <td>{sum('total_due')} Kč</td>
            <td>{sum('paid_amount')} Kč</td>
            <td>{sum('debt')} Kč</td>
          </tr>
        </tfoot>
      </table>
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Summary</h2>
        <p><strong>Overpayment/Underpayment:</strong> {(sum('paid_amount') - sum('total_due'))} Kč</p>
      </div>
    </div>
  );
}
