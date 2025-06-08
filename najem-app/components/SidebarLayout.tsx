// components/SidebarLayout.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const navItems = [
  { name: 'Nemovitosti', href: '/properties' },
  { name: 'Přidat nemovitost', href: '/properties/new' },
  { name: 'Profil', href: '/profile' },
  { name: 'Odhlásit', href: '/logout' },
]

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`bg-gray-800 text-white w-64 p-4 space-y-4 fixed md:static top-0 left-0 h-full transform md:translate-x-0 transition-transform duration-200 z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:block`}
      >
        <h2 className="text-xl font-bold mb-6">Správa nájmů</h2>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-2 py-1 rounded hover:bg-gray-700"
            onClick={() => setIsOpen(false)}
          >
            {item.name}
          </Link>
        ))}
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Content */}
      <div className="flex-1 md:ml-64 p-4">
        {/* Mobile toggle */}
        <button
          className="md:hidden mb-4"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <X className="text-gray-800" /> : <Menu className="text-gray-800" />}
        </button>

        {children}
      </div>
    </div>
  )
}
