// app/units/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamicImport from 'next/dynamic'
import DocumentUpload from '@/components/DocumentUpload'

const ExpensesList = dynamicImport(() => import('@/components/ExpensesList'), { ssr: false })

interface UnitForm {
  property_id: string;
  identifier: string;
  floor: number | '';
  disposition: string;
  area: number | '';
  occupancy_status: string;
  monthly_rent: number | '';
  deposit: number | '';
  description: string;
}

interface Property {
  id: string;
  name: string;
}

export default function EditUnitPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const refreshDokumenty = () => {};

  const [form, setForm] = useState<UnitForm>({
    property_id: '',
    identifier: '',
    floor: '',
    disposition: '',
    area: '',
    occupancy_status: 'volné',
    monthly_rent: '',
    deposit: '',
    description: '',
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitRes, propRes] = await Promise.all([
          fetch(`/api/units/${id}`, { credentials: 'include' }),
          fetch('/api/properties', { credentials: 'include' }),
        ]);

        if (!unitRes.ok) throw new Error('Jednotka nenalezena');
        const unit = await unitRes.json();
        const propList: Property[] = await propRes.json();

        setForm({
          property_id: unit.property_id ?? '',
          identifier: unit.identifier ?? '',
          floor: unit.floor ?? '',
          disposition: unit.disposition ?? '',
          area: unit.area ?? '',
          occupancy_status: unit.occupancy_status || 'volné',
          monthly_rent: unit.monthly_rent ?? '',
          deposit: unit.deposit ?? '',
          description: unit.description ?? '',
        });

        setProperties(Array.isArray(propList) ? propList : []);
        setIsLoading(false);
      } catch (err) {
        setError((err as Error).message || 'Chyba při načítání');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`/api/units/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Chyba při ukládání');
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (isLoading) return <p className="p-8">Načítání...</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Editace jednotky</h1>
      <form onSubmit={handleSave} className="space-y-4">
        {/* ... formulářová pole zůstávají ... */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nemovitost</label>
          <select
            value={form.property_id}
            onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}
            required
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          >
            <option value="">Vyberte nemovitost</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        {/* ... další pole ... */}
        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
          Uložit změny
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
      <ExpensesList unitId={id} />
      <DocumentUpload unitId={id} onUpload={refreshDokumenty} />
      <DocumentList unitId={id} onChange={refreshDokumenty} />
    </div>
  );
}
