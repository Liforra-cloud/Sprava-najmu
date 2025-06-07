// app/properties/page.tsx
'use client';

import { useEffect, useState } from 'react';

// Ručně definovaný typ pro Properties místo importu z Prisma (klientský kód nesmí importovat @prisma/client)
type Property = {
  id: string;
  name: string;
  address: string;
  units: { id: string; identifier: string }[];
};

export default function PropertiesPage() {
  const [list, setList] = useState<Property[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetch('/api/properties')
      .then(res => res.json())
      .then((data: Property[]) => setList(data));
  }, []);

  const add = async () => {
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address }),
    });
    const created: Property = await res.json();
    setList(prev => [...prev, created]);
    setName('');
    setAddress('');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Nemovitosti</h1>
      <div className="mb-6 flex gap-2">
        <input
          className="border p-2 flex-1"
          placeholder="Název"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="border p-2 flex-1"
          placeholder="Adresa"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4" onClick={add}>
          Přidat
        </button>
      </div>
      <ul className="space-y-2">
        {list.map(prop => (
          <li key={prop.id} className="p-4 border rounded">
            <strong>{prop.name}</strong><br />
            <span>{prop.address}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
