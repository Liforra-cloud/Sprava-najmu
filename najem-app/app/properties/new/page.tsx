// app/properties/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPropertyPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('');             // nový stav
  const [description, setDescription] = useState(''); // nový stav
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address, property_type: type, description }),
    });
    const json = await res.json();
    if (!res.ok) setError(json.error ?? 'Chyba');
    else router.push('/properties');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ...jméno a adresa */}
      <div>
        <label>Typ nemovitosti</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">— vyberte —</option>
          <option value="bytový dům">Bytový dům</option>
          <option value="komerční objekt">Komerční objekt</option>
          <option value="garáž">Garáž</option>
        </select>
      </div>
      <div>
        <label>Popis (volitelně)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
          rows={4}
        />
      </div>
      {/* ...tlačítka */}
    </form>
  );
}
