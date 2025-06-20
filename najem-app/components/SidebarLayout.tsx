// components/SidebarLayout.tsx

import { redirect } from 'next/navigation'
import { supabaseServerClient } from '@/lib/supabaseServerClient'
import SidebarMenu from './SidebarMenu'

export default async function SidebarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = supabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/properties', label: 'Nemovitosti' },
    { href: '/units', label: 'Jednotky' },
    { href: '/tenants', label: 'Nájemníci' },
    { href: '/expenses', label: 'Náklady' },
  ]

  return (
    <div className="flex h-screen">
      <SidebarMenu navItems={navItems} userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-auto md:ml-64">{children}</main>
    </div>
  )
}

