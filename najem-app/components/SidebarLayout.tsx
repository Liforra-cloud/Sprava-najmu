// components/SidebarLayout.tsx

import { redirect } from 'next/navigation'
import { supabaseServerClient } from '@/lib/supabaseServerClient'
import Link from 'next/link'
import { LogOut } from 'lucide-react'

export default async function SidebarLayout({ children }: { children: React.ReactNode }) {
  // Načti uživatele serverově
  const supabase = supabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Sidebar navigace – PŘIDÁNO tenants a expenses!
  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/properties', label: 'Nemovitosti' },
    { href: '/properties/new', label: 'Přidat nemovitost' },
    { href: '/units', label: 'Jednotky' },
    { href: '/units/new', label: 'Přidat jednotku' },
    { href: '/tenants', label: 'Nájemníci' },
    { href: '/tenants/new', label: 'Přidat nájemníka' },
    { href: '/expenses', label: 'Náklady' }, // <-- Přidáno
    { href: '/expenses/new', label: 'Přidat náklad' }, // (volitelné)
  ]

  return (
    <div className="flex h-screen w-screen">
      <aside className="w-64 bg-gray-100 border-r border-gray-300 p-4 flex flex-col justify-between">
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Správa nájmu</h1>
          <nav className="space-y-2">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2 rounded transition"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-4 text-sm text-gray-700">
          {user.email && <div className="mb-2 truncate">{user.email}</div>}
          <form action="/api/logout" method="POST">
            <button className="flex items-center gap-2 text-red-600 hover:underline">
              <LogOut className="w-4 h-4" />
              Odhlásit se
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
