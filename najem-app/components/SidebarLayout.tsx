// components/SidebarLayout.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogOut, Menu } from 'lucide-react'
import { supabaseServerClient } from '@/lib/supabaseServerClient'
import { redirect } from 'next/navigation'

export default async function SidebarLayout({ children }: { children: React.ReactNode }) {
  // Server-side user auth
  const supabase = supabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  // Client-side only for sidebar toggle
  // Všimni si - hook se dá použít jen v client komponentě (proto je v async wrapperu dole)
  return <SidebarLayoutClient user={user} navItems={navItems}>{children}</SidebarLayoutClient>
}

// Tohle je samostatná client-side komponenta kvůli useState
function SidebarLayoutClient({ user, navItems, children }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen">
      {/* Hamburger menu pouze na mobilech */}
      <button
        className="fixed top-4 left-4 z-30 md:hidden bg-white rounded-full p-2 shadow border border-gray-200"
        aria-label="Otevřít menu"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar overlay – pouze na mobilech */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-200 z-20
          ${sidebarOpen ? 'block' : 'hidden'} md:hidden
        `}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed z-30 top-0 left-0 h-full w-64 bg-gray-100 border-r border-gray-300 p-4 flex flex-col justify-between
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:flex
        `}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Správa nájmu</h1>
            {/* Zavřít button na mobilech */}
            <button
              className="md:hidden text-gray-500 p-1"
              onClick={() => setSidebarOpen(false)}
              aria-label="Zavřít menu"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
          <nav className="space-y-2">
            {navItems.map(({ href, label }: any) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2 rounded transition"
                onClick={() => setSidebarOpen(false)} // Zavřít menu po kliknutí na mobilu
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
