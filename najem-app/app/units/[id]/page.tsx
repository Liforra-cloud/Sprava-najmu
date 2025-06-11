// app/units/[id]/page.tsx


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TenantItem {
  id: string;
  tenant_id: string;
  lease_start: string | null;
  lease_end: string | null;
  note: string | null;
  tenant: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  }
}

export default function EditUnitPage({ params }: { params: { id: string } }) {
  // ...původní kód...

  // --- Nové: Správa nájemníků ---
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [allTenants, setAllTenants] = useState<any[]>([]);
  const [newTenantId, setNewTenantId] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseNote, setLeaseNote] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // Původní fetch jednotky a properties
      try {
        const [unitRes, propRes, tenantsRes] = await Promise.all([
          fetch(`/api/units/${id}`, { credentials: 'include' }),
          fetch('/api/properties', { credentials: 'include' }),
          fetch('/api/tenants', { credentials: 'include' }),
        ]);

        if (!unitRes.ok) throw new Error('Jednotka nenalezena');
        const unitData = await unitRes.json();

        setForm({
          property_id: unitData.property_id ?? '',
          identifier: unitData.identifier ?? '',
          floor: unitData.floor ?? '',
          disposition: unitData.disposition ?? '',
          area: unitData.area ?? '',
          occupancy_status: unitData.occupancy_status || 'volné',
          monthly_rent: unitData.monthly_rent ?? '',
          deposit: unitData.deposit ?? '',
          description: unitData.description ?? '',
        });

        setTenants(unitData.tenants || []);
        setProperties(Array.isArray(await propRes.json()) ? await propRes.json() : []);
        setAllTenants(await tenantsRes.json());
        setIsLoading(false);
      } catch (err) {
        setError((err as Error).message || 'Chyba při načítání');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Přidání nájemníka k jednotce
  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/unit-tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          unit_id: id,
          tenant_id: newTenantId,
          lease_start: leaseStart,
          note: leaseNote
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Chyba při přidávání nájemníka');
      }
      // Refresh page data
      setNewTenantId('');
      setLeaseStart('');
      setLeaseNote('');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
    setIsSaving(false);
  };

  // Odebrání nájemníka z jednotky
  const handleRemoveTenant = async (itemId: string) => {
    if (!confirm('Odebrat tohoto nájemníka z jednotky?')) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/unit-tenants/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Chyba při odebírání nájemníka');
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
    setIsSaving(false);
  };

  // ...tvůj původní render formulář jednotky...
  // Přidej pod něj nový blok pro nájemníky:

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      {/* ...formulář jednotky... */}

      <h2 className="text-xl font-semibold mt-8 mb-2">Nájemníci v jednotce</h2>
      <ul className="mb-4 space-y-1">
        {tenants.length === 0 && <li className="text-gray-500">Žádný nájemník</li>}
        {tenants.map(t => (
          <li key={t.id} className="flex justify-between items-center border-b py-2">
            <div>
              <span className="font-medium">{t.tenant?.full_name}</span>
              <span className="ml-2 text-gray-500 text-sm">{t.tenant?.email}</span>
              {t.lease_start && (
                <span className="ml-2 text-sm text-gray-600">od {new Date(t.lease_start).toLocaleDateString()}</span>
              )}
              {t.note && (
                <span className="ml-2 italic text-xs text-gray-500">({t.note})</span>
              )}
            </div>
            <button
              className="text-red-600 px-2 py-1 rounded hover:bg-red-100"
              onClick={() => handleRemoveTenant(t.id)}
            >
              Odebrat
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddTenant} className="bg-gray-50 p-4 rounded mb-4">
        <h3 className="font-medium mb-2">Přidat nájemníka</h3>
        <div className="flex gap-2">
          <select
            required
            value={newTenantId}
            onChange={e => setNewTenantId(e.target.value)}
            className="border rounded px-2 py-1 flex-1"
          >
            <option value="">Vyberte nájemníka</option>
            {allTenants.map(ten => (
              <option key={ten.id} value={ten.id}>{ten.full_name}</option>
            ))}
          </select>
          <input
            type="date"
            value={leaseStart}
            onChange={e => setLeaseStart(e.target.value)}
            className="border rounded px-2 py-1"
            required
          />
          <input
            type="text"
            placeholder="poznámka"
            value={leaseNote}
            onChange={e => setLeaseNote(e.target.value)}
            className="border rounded px-2 py-1 flex-1"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            Přidat
          </button>
        </div>
      </form>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

