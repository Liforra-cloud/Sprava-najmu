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
  { href: '/properties/new', label: 'Přidat nemovitost', icon: <PlusSquare size={18} /> },
  { href: '/profile', label: 'Profil', icon: <User size={18} /> },
  { href: '/logout', label: 'Odhlásit', icon: <LogOut size={18} /> },
]

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

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
        <nav className="mt-4 space-y-1 px-4">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition ${
                pathname === href ? 'bg-slate-700 font-semibold' : 'text-slate-300'
              }`}
              onClick={() => setIsOpen(false)}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        {/* Topbar on mobile */}
        <div className="md:hidden bg-white border-b px-4 py-2 shadow-sm flex items-center justify-between">
          <button onClick={() => setIsOpen(true)} className="text-slate-800">
            <Menu size={24} />
          </button>
          <span className="font-medium">Správa nájmů</span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
