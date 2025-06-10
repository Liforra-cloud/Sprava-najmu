// app/units/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Property {
  id: string;
  name: string;
}

interface UnitForm {
  property_id: string;
  identifier: string;
  floor: number | string;
  disposition: string;
  area: number | string;
  occupancy_status: string;
  monthly_rent: number | string;
  deposit: number | string;
  description: string;
}

export default function EditUnitPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitRes, propRes] = await Promise.all([
          fetch(`/api/units/${id}`, { credentials: 'include' }),
          fetch('/api/properties', { credentials: 'include' }),
        ]);

        if (!unitRes.ok) throw new Error('Jednotka nenalezena');
        const unit: unknown = await unitRes.json();
        const propList: unknown = await propRes.json();

        // typová kontrola (lze vylepšit dle backendu)
        if (
          typeof unit === 'object' &&
          unit !== null &&
          'property_id' in unit &&
          'identifier' in unit
        ) {
          setForm({
            property_id: (unit as any).property_id ?? '',
            identifier: (unit as any).identifier ?? '',
            floor: (unit as any).floor ?? '',
            disposition: (unit as any).disposition ?? '',
            area: (unit as any).area ?? '',
            occupancy_status: (unit as any).occupancy_status || 'volné',
            monthly_rent: (unit as any).monthly_rent ?? '',
            deposit: (unit as any).deposit ?? '',
            description: (unit as any).description ?? '',
          });
        }

        setProperties(Array.isArray(propList) ? (propList as Property[]) : []);
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
    setIsSaving(true);
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
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Opravdu smazat tuto jednotku?')) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/units/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Chyba při mazání');
      }
      router.push('/units');
    } catch (err) {
      setError((err as Error).message);
      setIsSaving(false);
    }
  };

  if (isLoading) return <p className="p-8">Načítání...</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Editace jednotky</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nemovitost
          </label>
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
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Označení jednotky
          </label>
          <input
            type="text"
            required
            value={form.identifier}
            onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Podlaží
          </label>
          <input
            type="number"
            value={form.floor}
            onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dispozice
          </label>
          <input
            type="text"
            value={form.disposition}
            onChange={e => setForm(f => ({ ...f, disposition: e.target.value }))}
            placeholder="např. 2+kk"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rozloha (m²)
          </label>
          <input
            type="number"
            value={form.area}
            onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stav obsazenosti
          </label>
          <select
            value={form.occupancy_status}
            onChange={e => setForm(f => ({ ...f, occupancy_status: e.target.value }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          >
            <option value="volné">Volné</option>
            <option value="obsazené">Obsazené</option>
            <option value="rezervováno">Rezervováno</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nájem (Kč)
          </label>
          <input
            type="number"
            value={form.monthly_rent}
            onChange={e => setForm(f => ({ ...f, monthly_rent: e.target.value }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Kauce (Kč)
          </label>
          <input
            type="number"
            value={form.deposit}
            onChange={e => setForm(f => ({ ...f, deposit: e.target.value }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Popis jednotky
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            {isSaving ? 'Ukládám...' : 'Uložit změny'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Smazat jednotku
          </button>
        </div>
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  );
}
