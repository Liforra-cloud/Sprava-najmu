'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // Uložíme do tabulky profiles
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
      });
      router.push('/login');
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 shadow-lg rounded-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Registrace</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Heslo"
          className="w-full p-3 border rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button type="submit" className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700">
          Registrovat se
        </button>
        <div className="text-sm text-center mt-4">
          <p>
            Máš už účet?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Přihlas se
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
