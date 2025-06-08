// app/properties/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPropertyPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        address, 
        property_type: type, 
        description 
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Chyba při ukládání nemovitosti');
    } else {
      router.push('/properties');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Nová nemovitost</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Název</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Adresa</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Typ nemovitosti</label>
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
          <label className="block mb-1">Popis (volitelně)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={4}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white p-2 rounded"
          >
            Uložit
          </button>
          <button
            type="button"
            onClick={() => router.push('/properties')}
            className="flex-1 bg-gray-300 text-gray-800 p-2 rounded"
          >
            Zrušit
          </button>
        </div>
      </form>
    </div>
  );
}
