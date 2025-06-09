// app/properties/layout.tsx

import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { supabaseServerClient } from '@/lib/supabaseServerClient'
import SidebarLayout from '@/components/SidebarLayout'

export default async function PropertiesLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  )
}
