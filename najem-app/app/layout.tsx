// app/layout.tsx

import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Správa nájmů',
  description: 'Aplikace pro správu nemovitostí a nájmů',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <h1 style={{color: 'red', background: 'yellow'}}>ROOT LAYOUT DEBUG</h1>
        {children}
      </body>
    </html>
  )
}
