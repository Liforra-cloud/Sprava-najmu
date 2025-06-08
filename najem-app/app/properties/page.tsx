// app/properties/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Property = {
  id: string;
  name: string;
  address: string;
};

export default function PropertiesPage() {
  const [list, setList] = useState<Property[]>([]);

  useEffect(() => {
    fetch('/api/properties')
      .then(async res => {
        const json = await res.json();
        if (res.ok) setList(json);
        else setList([]);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Nemovitosti</h1>
        <Link href="/properties/new">
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Přidat nemovitost
          </button>
        </Link>
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
