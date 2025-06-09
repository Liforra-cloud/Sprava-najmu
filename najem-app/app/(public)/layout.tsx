// app/(public)/layout.tsx

import { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <h1 style={{color: 'green', background: 'yellow'}}>PUBLIC LAYOUT</h1>
      {children}
    </>
  )
}
