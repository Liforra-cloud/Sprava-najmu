import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Vítejte v aplikaci Správa nájmů</h1>
      <p className="mb-6 text-lg">Přihlaste se nebo si vytvořte účet pro správu nemovitostí.</p>
      <div className="space-x-4">
        <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">Přihlásit se</Link>
        <Link href="/register" className="bg-gray-300 text-black px-4 py-2 rounded">Registrovat se</Link>
      </div>
    </main>
  );
}
