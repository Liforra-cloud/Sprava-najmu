'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 shadow-lg rounded-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Přihlášení</h1>
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
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700">
          Přihlásit se
        </button>
        <div className="text-sm text-center mt-4 space-y-1">
          <p>
            Nemáš účet?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Registruj se
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              Zapomenuté heslo
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
