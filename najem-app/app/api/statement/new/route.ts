// app/statements/new/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

// Typy pro data z API
type YearMonth = { year: number; month: number }
type StatementRow = {
  id:    string
  name:  string
  values: number[]
  total: number
}
type PaymentsMatrix = {
  months: YearMonth[]
  data:   StatementRow[]
}
type Tenant = {
  full_name: string
}

export default function NewStatementPage() {
  const params = useSearchParams()
  const unitId = params.get('unit_id') ?? ''

  const [paymentsMatrix, setPaymentsMatrix] = useState<PaymentsMatrix | null>(null)
  const [tenant, setTenant]                 = useState<Tenant | null>(null)
  const [error, setError]                   = useState<string | null>(null)

  useEffect(() => {
    if (!unitId) {
      setError('Chybí unit_id v URL parametrech')
      return
    }

    const from = '2025-01'
    const to   = '2025-12'
    fetch(`/api/statement?unitId=${unitId}&from=${from}&to=${to}`)
      .then(async res => {
        if (!res.ok) {
          const payload = await res.json()
          throw new Error(payload.error ?? 'Neznámá chyba')
        }
        return res.json()
      })
      .then(payload => {
        // Správně destrukturuji data, ne data.data
        const pm = payload.paymentsMatrix as PaymentsMatrix
        setPaymentsMatrix(pm)
        setTenant(payload.tenant as Tenant)
      })
      .catch(err => {
        setError(err.message)
      })
  }, [unitId])

  if (error) {
    return <div className="text-red-600">Chyba: {error}</div>
  }
  if (!paymentsMatrix) {
    return <div>Načítám vyúčtování…</div>
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Vyúčtování jednotky {unitId}</h1>
      <p className="mb-6">
        Nájemník: <strong>{tenant?.full_name ?? '—'}</strong>
      </p>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1 text-left">Položka</th>
            {paymentsMatrix.months.map(m => (
              <th key={`${m.year}-${m.month}`} className="border px-2 py-1">
                {String(m.month).padStart(2, '0')}/{m.year}
              </th>
            ))}
            <th className="border px-2 py-1">Součet</th>
          </tr>
        </thead>
        <tbody>
          {paymentsMatrix.data.map(row => (
            <tr key={row.id}>
              <td className="border px-2 py-1">{row.name}</td>
              {row.values.map((v, i) => (
                <td key={i} className="border px-2 py-1">{v}</td>
              ))}
              <td className="border px-2 py-1 font-semibold">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
