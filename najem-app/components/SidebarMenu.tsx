// components/SidebarMenu.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'

type NavItem = { href: string; label: string }

export default function SidebarMenu({
  navItems,
  userEmail,
}: {
  navItems: NavItem[]
  userEmail: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* tlačítko pro otevření/zavření sidebaru na mobilu */}
      <div className="md:hidden flex justify-between items-center p-4 bg-gray-100 border-b border-gray-300">
        <h1 className="text-lg font-bold">Menu</h1>
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 text-xl leading-none"
          aria-label="Otevřít/zavřít menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* samotný sidebar */}
      <aside
        className={`
          bg-gray-100 border-r border-gray-300
          w-64 h-full fixed z-40 top-0 left-0
          transform ${open ? 'translate-x-0' : '-translate-x-full'}
          transition-transform duration-200
          md:translate-x-0 md:static md:block
        `}
      >
        <div className="flex flex-col justify-between h-full p-4">
          <nav className="space-y-2">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded hover:bg-gray-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 text-sm">
            {userEmail && (
              <div className="mb-4 truncate">{userEmail}</div>
            )}
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-2 text-red-600 hover:underline"
              >
                <LogOut className="w-4 h-4" />
                Odhlásit se
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
