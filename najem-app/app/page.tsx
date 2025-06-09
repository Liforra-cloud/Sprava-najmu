// app/page.tsx

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-6">Správa nájmů</h1>
      <p className="mb-6">Vítejte v aplikaci pro správu nemovitostí a nájemních vztahů.</p>
      <div className="flex space-x-4">
        <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Přihlásit se</Link>
        <Link href="/register" className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">Registrovat se</Link>
      </div>
    </main>
  );
}
