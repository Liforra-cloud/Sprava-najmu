// components/SidebarLayout.tsx

import { redirect } from 'next/navigation'
import { supabaseServerClient } from '@/lib/supabaseServerClient'
import Link from 'next/link'
import { LogOut, Menu } from 'lucide-react'
import { useState } from 'react'

export default async function SidebarLayout({ children }: { children: React.ReactNode }) {
  // Načti uživatele serverově
  const supabase = supabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Sidebar navigace
  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/properties', label: 'Nemovitosti' },
    { href: '/properties/new', label: 'Přidat nemovitost' },
    { href: '/units', label: 'Jednotky' },
    { href: '/units/new', label: 'Přidat jednotku' },
    { href: '/tenants', label: 'Nájemníci' },
    { href: '/tenants/new', label: 'Přidat nájemníka' },
    { href: '/expenses', label: 'Náklady' },
    { href: '/expenses/new', label: 'Přidat náklad' },
  ]

  // --- Přidáno: Hamburger menu a stav zobrazení sidebaru
  // Protože jsi chtěl async komponentu, řeším stav přes "useState" ve vnořené client komponentě

  return (
    <SidebarWithHamburger navItems={navItems} user={user}>
      {children}
    </SidebarWithHamburger>
  )
}

// Client-only wrapper pro stav hamburger menu
'use client'
import { ReactNode } from 'react'

function SidebarWithHamburger({ navItems, user, children }: {
  navItems: { href: string, label: string }[]
  user: any
  children: ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen">
      {/* Hamburger only on small screens */}
      <button
        className="md:hidden fixed z-30 top-4 left-4 bg-white p-2 rounded shadow border"
        aria-label="Otevřít menu"
        onClick={() => setSidebarOpen(true)}
        type="button"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static z-20
          top-0 left-0 h-full w-64 bg-gray-100 border-r border-gray-300 p-4 flex flex-col justify-between
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
        style={{ minWidth: 256 }}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">Správa nájmu</h1>
            {/* Close btn only on mobile */}
            <button
              className="md:hidden p-1 rounded"
              aria-label="Zavřít menu"
              onClick={() => setSidebarOpen(false)}
              type="button"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
          <nav className="space-y-2">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2 rounded transition"
                onClick={() => setSidebarOpen(false)}
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

      {/* Overlay pro mobil při otevřeném menu */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
