// app/dashboard/layout.tsx

import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { supabaseServerClient } from '@/lib/supabaseServerClient'
import SidebarLayout from '@/components/SidebarLayout'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  )
}

export default function DashboardPage() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold text-center">
        Probíhá výstavba 🚧
      </h1>
    </main>
  );
}
