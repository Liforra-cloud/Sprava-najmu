'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push('/login');
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="p-8 bg-white shadow rounded w-full max-w-md">
        <h2 className="text-2xl mb-4">Registrace</h2>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full mb-3 p-2 border rounded" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Heslo" className="w-full mb-4 p-2 border rounded" />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">Registrovat se</button>
      </form>
    </main>
  );
}
