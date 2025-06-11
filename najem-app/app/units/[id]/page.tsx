// app/units/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Property {
  id: string;
  name: string;
}

interface Tenant {
  id: string;
  full_name: string;
  email: string;
}

interface UnitTenant {
  id: string;
  tenant_id: string;
  tenant: Tenant;
  date_from: string;
  date_to?: string | null;
  contract_number?: string | null;
  note?: string | null;
}

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

export default function EditUnitPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  // Nájemníci
  const [unitTenants, setUnitTenants] = useState<UnitTenant[]>([]);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({
    tenant_id: '',
    date_from: '',
    date_to: '',
    contract_number: '',
    note: '',
  });
  const [tenantSaveError, setTenantSaveError] = useState('');

  // Jednotka
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
        const [unitRes, propRes, tenantsRes] = await Promise.all([
          fetch(`/api/units/${id}`, { credentials: 'include' }),
          fetch('/api/properties', { credentials: 'include' }),
          fetch('/api/tenants', { credentials: 'include' }),
        ]);

        if (!unitRes.ok) throw new Error('Jednotka nenalezena');
        const unit = await unitRes.json();
        const propList: Property[] = await propRes.json();
        const tenantList: Tenant[] = await tenantsRes.json();

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

        setUnitTenants(unit.tenants ?? []);
        setAllTenants(Array.isArray(tenantList) ? tenantList : []);
        setProperties(Array.isArray(propList) ? propList : []);
        setIsLoading(false);
      } catch (err) {
        setError((err as Error).message || 'Chyba při načítání');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Uložení změn jednotky
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

  // Smazání jednotky
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

  // Přidání nájemníka k jednotce
  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantSaveError('');
    try {
      // Pokud date_to je "", dej null
      const payload = {
        unit_id: id,
        ...newTenant,
        date_to: newTenant.date_to === '' ? null : newTenant.date_to,
      };

      const res = await fetch('/api/unit-tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Chyba při přiřazení nájemníka');
      }
      setShowAddTenant(false);
      setNewTenant({ tenant_id: '', date_from: '', date_to: '', contract_number: '', note: '' });
      const unitRes = await fetch(`/api/units/${id}`, { credentials: 'include' });
      if (unitRes.ok) {
        const unit = await unitRes.json();
        setUnitTenants(unit.tenants ?? []);
      }
    } catch (err) {
      setTenantSaveError((err as Error).message || 'Chyba');
    }
  };

  if (isLoading) return <p className="p-8">Načítání...</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Editace jednotky</h1>
      <form onSubmit={handleSave} className="space-y-4">
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Označení jednotky</label>
          <input
            type="text"
            required
            value={form.identifier}
            onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Podlaží</label>
          <input
            type="number"
            value={form.floor}
            onChange={e => setForm(f => ({ ...f, floor: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Dispozice</label>
          <input
            type="text"
            value={form.disposition}
            onChange={e => setForm(f => ({ ...f, disposition: e.target.value }))}
            placeholder="např. 2+kk"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Rozloha (m²)</label>
          <input
            type="number"
            value={form.area}
            onChange={e => setForm(f => ({ ...f, area: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Stav obsazenosti</label>
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
          <label className="block text-sm font-medium text-gray-700">Nájem (Kč)</label>
          <input
            type="number"
            value={form.monthly_rent}
            onChange={e => setForm(f => ({ ...f, monthly_rent: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Kauce (Kč)</label>
          <input
            type="number"
            value={form.deposit}
            onChange={e => setForm(f => ({ ...f, deposit: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Popis jednotky</label>
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

      {/* --- Nájemníci v jednotce --- */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nájemníci v této jednotce</h2>
          <button
            className="bg-green-600 text-white px-3 py-1 rounded"
            onClick={() => setShowAddTenant(v => !v)}
          >
            {showAddTenant ? 'Zavřít' : 'Přidat nájemníka'}
          </button>
        </div>
     <ul className="mt-3 space-y-2">
  {unitTenants.length === 0 && <li className="text-gray-500">Žádní nájemníci</li>}
  {unitTenants.map(ut => (
    <li key={ut.id} className="p-2 border rounded flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        {/* Jméno jako odkaz na detail nájemníka */}
        <Link
          href={`/tenants/${ut.tenant?.id}`}
          className="font-bold text-blue-700 hover:underline mr-2"
        >
          {ut.tenant?.full_name}
        </Link>
        <span className="text-gray-500 text-xs">{ut.tenant?.email}</span>
        <span className="text-sm block">
          <b>Od:</b> {ut.date_from} {ut.date_to && <> <b>do:</b> {ut.date_to}</>}
          {ut.contract_number && <> <b> | Smlouva:</b> {ut.contract_number}</>}
        </span>
        {ut.note && <span className="text-xs text-gray-500">Poznámka: {ut.note}</span>}
      </div>
      <div className="flex gap-2 mt-2 md:mt-0">
        {/* Tlačítko pro editaci nájemníka */}
        <Link
          href={`/tenants/${ut.tenant?.id}`}
          className="bg-yellow-500 text-white px-3 py-1 rounded"
        >
          Upravit
        </Link>
        {/* Mazání přiřazení */}
        <button
          className="bg-red-500 text-white px-3 py-1 rounded"
          onClick={async () => {
            if (!confirm('Opravdu odebrat tohoto nájemníka z jednotky?')) return;
            await fetch(`/api/unit-tenants/${ut.id}`, {
              method: 'DELETE',
              credentials: 'include',
            });
            const unitRes = await fetch(`/api/units/${id}`, { credentials: 'include' });
            if (unitRes.ok) {
              const unit = await unitRes.json();
              setUnitTenants(unit.tenants ?? []);
            }
          }}
        >
          Odebrat
        </button>
      </div>
    </li>
  ))}
</ul>


        {showAddTenant && (
          <form onSubmit={handleAddTenant} className="mt-4 space-y-2 p-3 bg-gray-100 rounded">
            <div>
              <label className="block text-sm font-medium">Nájemník</label>
              <select
                required
                value={newTenant.tenant_id}
                onChange={e => setNewTenant(nt => ({ ...nt, tenant_id: e.target.value }))}
                className="w-full px-2 py-1 border rounded"
              >
                <option value="">Vyberte nájemníka…</option>
                {allTenants.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Od</label>
              <input
                type="date"
                required
                value={newTenant.date_from}
                onChange={e => setNewTenant(nt => ({ ...nt, date_from: e.target.value }))}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Do (nepovinné)</label>
              <input
                type="date"
                value={newTenant.date_to}
                onChange={e => setNewTenant(nt => ({ ...nt, date_to: e.target.value }))}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Číslo smlouvy (nepovinné)</label>
              <input
                type="text"
                value={newTenant.contract_number}
                onChange={e => setNewTenant(nt => ({ ...nt, contract_number: e.target.value }))}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Poznámka</label>
              <input
                type="text"
                value={newTenant.note}
                onChange={e => setNewTenant(nt => ({ ...nt, note: e.target.value }))}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1 rounded"
            >
              Přidat nájemníka
            </button>
            {tenantSaveError && <div className="text-red-600">{tenantSaveError}</div>}
          </form>
        )}
      </div>
    </div>
  );
}

