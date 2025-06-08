// app/properties/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPropertyPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [floor, setFloor] = useState<number | ''>('');
  const [disposition, setDisposition] = useState('');
  const [area, setArea] = useState<number | ''>('');
  const [monthlyRent, setMonthlyRent] = useState<number | ''>('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        address,
        description,
        unit: {
          identifier,
          floor: typeof floor === 'number' ? floor : null,
          disposition,
          area: typeof area === 'number' ? area : null,
          monthly_rent: typeof monthlyRent === 'number' ? monthlyRent : null
        }
      })
    });

    if (res.ok) {
      router.push('/properties');
    } else {
      const { error } = await res.json();
      alert(error || 'Chyba při ukládání');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Přidat nemovitost s jednotkou</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Property */}
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
          <label className="block mb-1">Popis (volitelný)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>

        <hr />

        {/* Unit */}
        <h2 className="text-xl font-semibold">Jednotka</h2>
        <div>
          <label className="block mb-1">Identifikátor</label>
          <input
            type="text"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Podlaží</label>
          <input
            type="number"
            value={floor}
            onChange={e => setFloor(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Dispozice</label>
          <input
            type="text"
            value={disposition}
            onChange={e => setDisposition(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Plocha (m²)</label>
          <input
            type="number"
            value={area}
            onChange={e => setArea(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Měsíční nájem</label>
          <input
            type="number"
            value={monthlyRent}
            onChange={e => setMonthlyRent(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Uložit vše
        </button>
      </form>
    </div>
  );
}
