// app/leases/layout.tsx

import { ReactNode } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import { redirect } from 'next/navigation'
import { supabaseServerClient } from '@/lib/supabaseServerClient'

export default async function TenantsLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  )
}
