// app/properties/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPropertyPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        address,
        property_type: propertyType,
        description
      })
    });
    if (res.ok) {
      router.push('/properties');
    } else {
      const { error } = await res.json();
      alert(error || 'Chyba při ukládání nemovitosti');
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
            value={propertyType}
            onChange={e => setPropertyType(e.target.value)}
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
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Uložit
        </button>
      </form>
    </div>
  );
}
