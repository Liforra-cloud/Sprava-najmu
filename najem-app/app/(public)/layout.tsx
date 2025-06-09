// app/layout.tsx

import './globals.css'
import { ReactNode } from 'react'
import SidebarLayout from '@/components/SidebarLayout'

export const metadata = {
  title: 'Správa nájmů',
  description: 'Aplikace pro správu nemovitostí a nájmů',
}

// Toto použij jen pro chráněné stránky! (ne pro /login, /register)
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </body>
    </html>
  )
}
