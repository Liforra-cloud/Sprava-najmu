'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  PlusSquare,
  User,
  LogOut,
  Menu
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const navItems = [
  { href: '/properties', label: 'Nemovitosti', icon: <Home size={18} /> },
  { href: '/properties/new', label: 'Přidat nemovitost', icon: <PlusSquare size={18} /> }
]

const accountItems = [
  { href: '/profile', label: 'Profil', icon: <User size={18} /> }
]

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (!error && user) {
        setUserEmail(user.email ?? 'Neznámý uživatel')
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-slate-800 text-white flex flex-col">
        <div className="flex items-center justify-center px-4 py-4 border-b border-slate-700">
          <span className="text-lg font-semibold">Správa nájmů</span>
        </div>

        <nav className="mt-4 space-y-1">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2 transition-all duration-150 rounded-r-md border-l-4 text-sm ${
                pathname === href
                  ? 'bg-slate-700 border-green-400 text-white font-semibold'
                  : 'border-transparent text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}

          <p className="text-xs text-slate-400 mt-6 mb-1 px-4 uppercase tracking-wide">Účet</p>

          {accountItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2 transition-all duration-150 rounded-r-md border-l-4 text-sm ${
                pathname === href
                  ? 'bg-slate-700 border-green-400 text-white font-semibold'
                  : 'border-transparent text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 mt-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-150 w-full text-left text-sm"
          >
            <LogOut size={18} />
            <span>Odhlásit</span>
          </button>

          {userEmail && (
            <div className="text-xs text-slate-400 px-4 mt-6">
              Přihlášen jako:
              <br />
              <span className="text-white font-medium break-words">{userEmail}</span>
            </div>
          )}
        </nav>
      </div>

      {/* Obsah stránky (hned vedle) */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
