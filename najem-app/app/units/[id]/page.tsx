// app/units/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';

const ExpensesList = dynamicImport(() => import('@/components/ExpensesList'), { ssr: false });

interface Tenant {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
}

interface Lease {
  id: string;
  tenant: Tenant | null;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  monthly_services: number;
  deposit: number;
  name: string | null;
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

  const refreshDokumenty = () => setRefreshKey(k => k + 1);
  const propertyName = properties.find(p => p.id === unit?.property_id)?.name;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitRes, propRes] = await Promise.all([
          fetch(`/api/units/${id}`, { credentials: 'include' }),
          fetch('/api/properties', { credentials: 'include' }),
        ]);

        if (!unitRes.ok) throw new Error('Jednotka nenalezena');
        const unitData = await unitRes.json();
        const propList = await propRes.json();

        setUnit(unitData);
        setProperties(Array.isArray(propList) ? propList : []);
        setIsLoading(false);
      } catch (err) {
        setError((err as Error).message || 'Chyba při načítání');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) return <p className="p-8">Načítání...</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!unit) return null;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Detail jednotky</h1>
        <Link
          href={`/units/${id}/edit`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upravit jednotku
        </Link>
      </div>

      {/* 🏠 Základní informace */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Základní informace</h2>
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
      </div>

      {/* 👤 Aktuální nájem */}
      {unit.activeLeases.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-2">Aktuální nájem</h2>
          {unit.activeLeases.map(lease => (
            <div key={lease.id} className="border p-4 rounded mb-2 bg-gray-50">
              <p><strong>Nájemník:</strong> {lease.tenant?.full_name || 'Neznámý'}</p>
              <p><strong>Období:</strong> {lease.start_date} — {lease.end_date ?? 'neurčito'}</p>
              <p><strong>Nájemné:</strong> {lease.rent_amount} Kč</p>
              <p><strong>Zálohy na služby:</strong> {lease.monthly_services} Kč</p>
              <p><strong>Kauce:</strong> {lease.deposit} Kč</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-600 italic">Jednotka je aktuálně volná</div>
      )}

      {/* 📜 Historie nájmů */}
      {unit.pastLeases.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Historie pronájmů</h2>
          {unit.pastLeases.map(lease => (
            <div key={lease.id} className="border p-4 rounded mb-2">
              <p><strong>Nájemník:</strong> {lease.tenant?.full_name || 'Neznámý'}</p>
              <p><strong>Období:</strong> {lease.start_date} — {lease.end_date}</p>
              <p><strong>Nájemné:</strong> {lease.rent_amount} Kč</p>
            </div>
          ))}
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


