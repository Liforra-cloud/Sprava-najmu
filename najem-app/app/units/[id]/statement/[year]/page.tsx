//units/[id]/statement/[year]/page.tsx

// app/units/[id]/statement/[year]/page.tsx

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

export default function StatementPage({
  params,
}: {
  params: { id: string; year: string };
}) {
  const { id, year } = params;
  const [obligations, setObligations] = useState<MonthlyObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/units/${id}/statement/${year}`);
        if (!res.ok) {
          throw new Error('Failed to fetch statement');
        }
        const data: MonthlyObligation[] = await res.json();
        setObligations(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, year]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (obligations.length === 0) return <p>No data for this year.</p>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Unit Statement for {year}</h1>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Month</th>
            <th className="border px-2 py-1">Rent</th>
            <th className="border px-2 py-1">Services</th>
            <th className="border px-2 py-1">Water</th>
            <th className="border px-2 py-1">Gas</th>
            <th className="border px-2 py-1">Electricity</th>
            <th className="border px-2 py-1">Repair Fund</th>
            <th className="border px-2 py-1">Custom Charges</th>
            <th className="border px-2 py-1">Total Due</th>
            <th className="border px-2 py-1">Paid</th>
            <th className="border px-2 py-1">Debt</th>
          </tr>
        </thead>
        <tbody>
          {obligations.map((ob) => {
            // Parse custom_charges if needed
            let customChargesArr: CustomCharge[] = [];
            if (ob.custom_charges) {
              if (typeof ob.custom_charges === 'string') {
                try {
                  customChargesArr = JSON.parse(ob.custom_charges);
                } catch {
                  customChargesArr = [];
                }
              } else if (Array.isArray(ob.custom_charges)) {
                customChargesArr = ob.custom_charges;
              }
            }
            const customChargesSum = customChargesArr
              .filter(c => c && (c.billable ?? c.enabled))
              .reduce(
                (sum, c) =>
                  sum + (typeof c.amount === 'number' ? c.amount : Number(c.amount) || 0),
                0
              );

            return (
              <tr key={ob.id}>
                <td className="border px-2 py-1">{ob.month}</td>
                <td className="border px-2 py-1">{ob.rent} Kč</td>
                <td className="border px-2 py-1">{ob.services} Kč</td>
                <td className="border px-2 py-1">{ob.water} Kč</td>
                <td className="border px-2 py-1">{ob.gas} Kč</td>
                <td className="border px-2 py-1">{ob.electricity} Kč</td>
                <td className="border px-2 py-1">{ob.repair_fund} Kč</td>
                <td className="border px-2 py-1">
                  {customChargesSum > 0
                    ? customChargesArr
                        .filter(c => c.billable ?? c.enabled)
                        .map((c, idx) => (
                          <div key={idx}>
                            {c.name}: {c.amount} Kč
                          </div>
                        ))
                    : '-'}
                </td>
                <td className="border px-2 py-1">{ob.total_due} Kč</td>
                <td className="border px-2 py-1">{ob.paid_amount} Kč</td>
                <td className="border px-2 py-1">{ob.debt} Kč</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
