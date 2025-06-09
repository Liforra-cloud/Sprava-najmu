import './globals.css'
import { ReactNode } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import { supabaseServerClient } from '@/lib/supabaseServerClient'

export const metadata = {
  title: 'Správa nájmů',
  description: 'Aplikace pro správu nemovitostí a nájmů',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="cs">
      <body>
        <SidebarLayout userEmail={user?.email ?? null}>
          {children}
        </SidebarLayout>
      </body>
    </html>
  )
}
