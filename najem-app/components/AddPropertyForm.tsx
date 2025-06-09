// components/AddPropertyForm.tsx

'use client';

import { useState } from 'react';

export default function AddPropertyForm() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // <- důležité!
      body: JSON.stringify({ name, address, description }),
    });

    if (res.ok) {
      // úspěšně přidáno, reset formulář nebo redirect
      setName('');
      setAddress('');
      setDescription('');
      setSaving(false);
      alert('Nemovitost byla úspěšně přidána!');
    } else {
      const err = await res.json();
      setError(err.error || 'Něco se pokazilo.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-8">
      <div>
        <label className="block mb-1">Název</label>
        <input
          type="text"
          className="w-full border rounded p-2"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1">Adresa</label>
        <input
          type="text"
          className="w-full border rounded p-2"
          value={address}
          onChange={e => setAddress(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1">Popis (volitelný)</label>
        <textarea
          className="w-full border rounded p-2"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <button
        type="submit"
        className="bg-blue-700 text-white px-4 py-2 rounded"
        disabled={saving}
      >
        {saving ? 'Ukládám...' : 'Přidat nemovitost'}
      </button>
    </form>
  );
}
