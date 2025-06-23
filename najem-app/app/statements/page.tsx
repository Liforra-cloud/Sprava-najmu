// app/statements/page.tsx

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Statement = {
  id: string
  unit_id: string
  lease_id: string
  from_month: string
  to_month: string
  status: string
  total_due: number
  created_at: string
}

export default function StatementsListPage() {
  const [statements, setStatements] = useState<Statement[]>([])

  useEffect(() => {
    fetch('/api/statements')
      .then(res => res.json())
      .then(data => setStatements(data))
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Vyúčtování</h1>
      <Link href="/statements/new" className="bg-green-700 text-white px-3 py-1 rounded mb-4 inline-block">
        Nové vyúčtování
      </Link>
      <table className="min-w-full border mt-4">
        <thead>
          <tr>
            <th className="border p-2">Období</th>
            <th className="border p-2">Jednotka</th>
            <th className="border p-2">Stav</th>
            <th className="border p-2">Vytvořeno</th>
            <th className="border p-2">Akce</th>
          </tr>
        </thead>
        <tbody>
          {statements.map(s => (
            <tr key={s.id}>
              <td className="border p-2">{s.from_month} – {s.to_month}</td>
              <td className="border p-2">{s.unit_id}</td>
              <td className="border p-2">{s.status}</td>
              <td className="border p-2">{new Date(s.created_at).toLocaleString()}</td>
              <td className="border p-2">
                <Link href={`/statements/${s.id}`} className="text-blue-700 underline">
                  Otevřít
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
