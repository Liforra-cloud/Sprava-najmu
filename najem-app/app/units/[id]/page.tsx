// app/units/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';
import { PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

const ExpensesList = dynamicImport(() => import('@/components/ExpensesList'), { ssr: false });

interface Tenant {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
}

// DŮLEŽITÉ: TYP PRO VLASTNÍ POPLATKY
interface CustomCharge {
  name: string;
  amount: number;
  billable?: boolean;
}

interface MonthlyObligation {
  id: string;
  year: number;
  month: number;
  total_due: number;
  paid_amount: number;
  debt: number;
  rent: number;
  services: number;
  water?: number;
  gas?: number;
  electricity?: number;
  custom_charges?: CustomCharge[];
  // charge_flags?: { [key: string]: boolean };
}

interface Lease {
  id: string;
  tenant: Tenant | null;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  monthly_services?: number;
  deposit: number;
  name: string | null;
  monthly_obligations?: MonthlyObligation[];
}

interface Unit {
  id: string;
  property_id: string;
  identifier: string;
  floor: number | null;
  disposition: string;
  area: number | null;
  occupancy_status: string;
  monthly_rent: number | null;
  deposit: number | null;
  description: string;
  activeLeases: Lease[];
  pastLeases: Lease[];
}

interface Property {
  id: string;
  name: string;
}

export default function UnitDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // stav pro inline edit
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [basicForm, setBasicForm] = useState({
    identifier: '',
    disposition: '',
    floor: '' as string | number,
    area: '' as string | number,
    description: '',
    property_id: ''
  });

  const refreshDokumenty = () => setRefreshKey(k => k + 1);
  const propertyName = properties.find(p => p.id === unit?.property_id)?.name || '';

  // načtení dat
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitRes, propRes] = await Promise.all([
          fetch(`/api/units/${id}`, { credentials: 'include' }),
          fetch('/api/properties', { credentials: 'include' }),
        ]);

        if (!unitRes.ok) throw new Error('Jednotka nenalezena');
        const unitData: Unit = await unitRes.json();
        const propList: Property[] = await propRes.json();

        setUnit(unitData);
        setProperties(Array.isArray(propList) ? propList : []);
        setIsLoading(false);
      } catch (err) {
        setError((err as Error).message || 'Chyba při načítání');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, refreshKey]);

  // inicializace formuláře po načtení jednotky
  useEffect(() => {
    if (unit) {
      setBasicForm({
        identifier: unit.identifier,
        disposition: unit.disposition,
        floor: unit.floor ?? '',
        area: unit.area ?? '',
        description: unit.description,
        property_id: unit.property_id
      });
    }
  }, [unit]);

  // uložení změn
  const handleSaveBasic = async () => {
    try {
      const res = await fetch(`/api/units/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: basicForm.identifier,
          disposition: basicForm.disposition,
          floor: basicForm.floor === '' ? null : Number(basicForm.floor),
          area: basicForm.area === '' ? null : Number(basicForm.area),
          description: basicForm.description,
          property_id: basicForm.property_id
        })
      });
      if (!res.ok) throw new Error('Chyba při ukládání');
      const updated: Unit = await res.json();
      setUnit(prev => prev ? ({ ...prev, ...updated }) : updated);
      setIsEditingBasic(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (isLoading) return <p className="p-8">Načítání...</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!unit) return null;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Detail jednotky</h1>
        {/* Smazat jednotku */}
        <button
          onClick={async () => {
            if (confirm('Opravdu smazat tuto jednotku?')) {
              await fetch(`/api/units/${id}`, { method: 'DELETE' });
              window.location.href = '/units';
            }
          }}
          className="text-red-600 hover:underline"
        >
          Smazat jednotku
        </button>
      </div>

      {/* 🏠 Základní informace */}
      <div className="relative">
        <h2 className="text-lg font-semibold mb-2">Základní informace</h2>
        {!isEditingBasic ? (
          <>
            <button
              onClick={() => setIsEditingBasic(true)}
              className="absolute top-0 right-0 p-1 hover:bg-gray-100 rounded"
              title="Upravit základní údaje"
            >
              <PencilIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div className="space-y-1 text-gray-800">
              <p><strong>Označení:</strong> {unit.identifier}</p>
              <p><strong>Dispozice:</strong> {unit.disposition}</p>
              <p><strong>Patro:</strong> {unit.floor ?? '-'}</p>
              <p><strong>Plocha:</strong> {unit.area ?? '-'} m²</p>
              <p>
                <strong>Nemovitost:</strong>{' '}
                <Link href={`/properties/${unit.property_id}`} className="text-blue-700 underline">
                  {propertyName}
                </Link>
              </p>
              <p><strong>Popis:</strong> {unit.description || '-'}</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Označení</label>
                <input
                  type="text"
                  value={basicForm.identifier}
                  onChange={e => setBasicForm(f => ({ ...f, identifier: e.target.value }))}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Dispozice</label>
                <input
                  type="text"
                  value={basicForm.disposition}
                  onChange={e => setBasicForm(f => ({ ...f, disposition: e.target.value }))}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Patro</label>
                <input
                  type="number"
                  value={basicForm.floor}
                  onChange={e => setBasicForm(f => ({ ...f, floor: e.target.value }))}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Plocha (m²)</label>
                <input
                  type="number"
                  value={basicForm.area}
                  onChange={e => setBasicForm(f => ({ ...f, area: e.target.value }))}
                  className="mt-1 block w-full border rounded p-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Nemovitost</label>
              <select
                value={basicForm.property_id}
                onChange={e => setBasicForm(f => ({ ...f, property_id: e.target.value }))}
                className="mt-1 block w-full border rounded p-2"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Popis</label>
              <textarea
                value={basicForm.description}
                onChange={e => setBasicForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1 block w-full border rounded p-2"
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveBasic}
                className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                <CheckIcon className="h-5 w-5 mr-1" /> Uložit
              </button>
              <button
                onClick={() => {
                  // obnovit data a zrušit editaci
                  if (unit) {
                    setBasicForm({
                      identifier: unit.identifier,
                      disposition: unit.disposition,
                      floor: unit.floor ?? '',
                      area: unit.area ?? '',
                      description: unit.description,
                      property_id: unit.property_id
                    });
                  }
                  setIsEditingBasic(false);
                }}
                className="flex items-center bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                <XMarkIcon className="h-5 w-5 mr-1" /> Zrušit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 👤 Aktuální nájem */}
      {unit.activeLeases.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-2">Aktuální nájem</h2>
          {unit.activeLeases.map(lease => {
            const obligations: MonthlyObligation[] = lease.monthly_obligations ?? [];

            // Aktuální měsíc a rok
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;

            // Najdi obligation pro aktuální měsíc
            const currentOb = obligations.find(
              ob => ob.year === currentYear && ob.month === currentMonth
            );

            // Nájemné a zálohy na služby pro aktuální měsíc
            const monthlyRent = currentOb?.rent ?? 0;
            let monthlyServices = 0;
            if (currentOb) {
              monthlyServices += currentOb.services ?? 0;
              monthlyServices += currentOb.water ?? 0;
              monthlyServices += currentOb.gas ?? 0;
              monthlyServices += currentOb.electricity ?? 0;
              if (Array.isArray(currentOb.custom_charges)) {
                monthlyServices += currentOb.custom_charges
                  .filter(c => c.billable)
                  .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
              }
            }

            // Dluh za celé období (součet ob.debt)
            const totalDebt = obligations.reduce((sum, ob) => sum + (ob.debt ?? 0), 0);

            return (
              <div key={lease.id} className="border p-4 rounded mb-2 bg-gray-50 space-y-1">
                <p>
                  <strong>Nájemník:</strong>{' '}
                  {lease.tenant ? (
                    <Link
                      href={`/tenants/${lease.tenant.id}`}
                      className="text-blue-700 underline"
                    >
                      {lease.tenant.full_name}
                    </Link>
                  ) : (
                    'Neznámý'
                  )}
                </p>
                <p>
                  <strong>Období nájmu:</strong> {lease.start_date} — {lease.end_date ?? 'neurčito'}
                </p>
                <p>
                  <strong>Nájemné (aktuální měsíc):</strong> {monthlyRent} Kč
                </p>
                <p>
                  <strong>Zálohy na služby (aktuální měsíc):</strong> {monthlyServices} Kč
                </p>
                <p>
                  <strong>Kauce:</strong> {lease.deposit} Kč
                </p>
                <p>
                  <strong>Celkový dluh:</strong> {totalDebt} Kč
                </p>
                <div className="flex gap-2 mt-2">
                  <Link
                    href={`/leases/${lease.id}/edit`}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    Detail smlouvy
                  </Link>
                  {lease.tenant && (
                    <Link
                      href={`/tenants/${lease.tenant.id}`}
                      className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-800 text-sm"
                    >
                      Detail nájemníka
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-600 italic">Jednotka je aktuálně volná</div>
      )}

      {/* 📜 Historie pronájmů */}
      {unit.pastLeases.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Historie pronájmů</h2>
          {unit.pastLeases.map(lease => {
            const obligations = lease.monthly_obligations ?? [];
            const totalRent = obligations.reduce((sum, ob) => sum + (ob.rent ?? 0), 0);

            return (
              <div key={lease.id} className="border p-4 rounded mb-2">
                <p><strong>Nájemník:</strong> {lease.tenant?.full_name || 'Neznámý'}</p>
                <p><strong>Období:</strong> {lease.start_date} — {lease.end_date}</p>
                <p><strong>Nájemné (celkem):</strong> {totalRent} Kč</p>
                <div className="flex gap-2 mt-2">
                  <Link
                    href={`/leases/${lease.id}/edit`}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    Detail smlouvy
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 💸 Náklady */}
      <ExpensesList unitId={id} />

      {/* 📂 Dokumenty */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Dokumenty k jednotce</h2>
        <DocumentUpload unitId={id} onUpload={refreshDokumenty} />
        <DocumentList unitId={id} onChange={refreshDokumenty} key={refreshKey} />
      </div>
    </div>
  );
}


