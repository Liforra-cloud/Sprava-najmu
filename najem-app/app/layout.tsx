// app/layout.tsx

import './globals.css'
import { ReactNode } from 'react'
import SidebarLayout from '@/components/SidebarLayout'

export const metadata = {
  title: 'Správa nájmů',
  description: 'Aplikace pro správu nemovitostí a nájmů',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <h1 style={{color: 'red', background: 'yellow'}}>ROOT LAYOUT</h1>
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </body>
    </html>
  )
}
