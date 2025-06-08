'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  PlusSquare,
  User,
  LogOut,
  Menu
} from 'lucide-react'

const navItems = [
  { href: '/properties', label: 'Nemovitosti', icon: <Home size={18} /> },
  { href: '/properties/new', label: 'Přidat nemovitost', icon: <PlusSquare size={18} /> }
]

const accountItems = [
  { href: '/profile', label: 'Profil', icon: <User size={18} /> },
  { href: '/logout', label: 'Odhlásit', icon: <LogOut size={18} /> }
]

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Zde můžeš později načíst přihlášeného uživatele ze Supabase
  const userEmail = 'user@example.com'

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed z-20 inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out bg-slate-800 w-64 text-white`}>
        <div className="flex items-center justify-between md:justify-center px-4 py-4 border-b border-slate-700">
          <span className="text-lg font-semibold">Správa nájmů</span>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-white">
            ✕
          </button>
        </div>

        {/* Navigace */}
        <nav className="mt-4 space-y-1">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 transition-all duration-150 rounded-r-md border-l-4 ${
                pathname === href
                  ? 'bg-slate-700 border-green-400 text-white font-semibold'
                  : 'border-transparent text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}

          {/* Účetní sekce */}
          <p className="text-xs text-slate-400 mt-6 mb-1 px-4 uppercase tracking-wide">Účet</p>
          {accountItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 transition-all duration-150 rounded-r-md border-l-4 ${
                pathname === href
                  ? 'bg-slate-700 border-green-400 text-white font-semibold'
                  : 'border-transparent text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => setIsOpen(false)}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}

          {/* Přihlášený uživatel */}
          <div className="text-xs text-slate-400 px-4 mt-6">
            Přihlášen jako:
            <br />
            <span className="text-white font-medium">{userEmail}</span>
          </div>
        </nav>
      </div>

      {/* Obsah */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        {/* Topbar (mobil) */}
        <div className="md:hidden bg-white border-b px-4 py-2 shadow-sm flex items-center justify-between">
          <button onClick={() => setIsOpen(true)} className="text-slate-800">
            <Menu size={24} />
          </button>
          <span className="font-medium">Správa nájmů</span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
