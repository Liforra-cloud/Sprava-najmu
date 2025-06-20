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
      {/* Mobilní menu */}
      <div className="md:hidden flex justify-between items-center p-4 bg-gray-100 border-b border-gray-300">
        <h1 className="text-lg font-bold">Menu</h1>
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 text-xl"
          aria-label="Toggle Menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          w-64 h-screen bg-gray-100 border-r border-gray-300
          fixed top-0 left-0 z-40 transform
          ${open ? 'translate-x-0' : '-translate-x-full'}
          transition-transform duration-200 ease-in-out
          md:translate-x-0 md:static md:block
        `}
      >
        <div className="flex flex-col justify-between h-full p-4">
          <nav className="space-y-2">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2 rounded hover:bg-gray-200"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 text-sm">
            {userEmail && <div className="mb-4 truncate">{userEmail}</div>}
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
