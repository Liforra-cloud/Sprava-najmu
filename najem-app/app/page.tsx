'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-600">Správa nájmů</h1>
        <p className="text-gray-700 mb-6">
          Jednoduchá a přehledná aplikace pro správu nájemních vztahů a nemovitostí.
        </p>

        {!user ? (
          <div className="space-x-4">
            <Link href="/login">
              <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Přihlásit se
              </button>
            </Link>
            <Link href="/register">
              <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                Registrovat se
              </button>
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-green-600 mb-4">Přihlášen jako {user.email}</p>
            <Link href="/dashboard">
              <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Přejít do aplikace
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
