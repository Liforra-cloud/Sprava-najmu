// najem-app/app/leases/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Payment = {
  id: string
  amount: number
  payment_date: string
  payment_type?: string
  note?: string
}

type Lease = {
  id: string
  name: string
  start_date: string
  end_date?: string | null
  tenant?: {
    full_name: string
  }
  unit?: {
    identifier: string
  }
  totalBillableRent: number
  payments: Payment[]
}

export default function LeaseDetailPage() {
  const { id } = useParams()
  const [lease, setLease] = useState<Lease | null>(null)

  useEffect(() => {
    const fetchLease = async () => {
      const res = await fetch(`/api/leases/${id}`)
      const data = await res.json()
      setLease(data)
    }
    fetchLease()
  }, [id])

  if (!lease) return <p>Načítám…</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{lease.name}</h1>
      <p>Období: {lease.start_date} – {lease.end_date ?? 'neomezeno'}</p>
      <p>Nájemce: {lease.tenant?.full_name}</p>
      <p>Jednotka: {lease.unit?.identifier}</p>
      <p>Celkový nájem: {lease.totalBillableRent} Kč</p>

      <h2 className="text-xl font-semibold mt-6">Platby</h2>
      {lease.payments.length === 0 ? (
        <p>Žádné platby zatím nebyly zaznamenány.</p>
      ) : (
        <ul className="border rounded divide-y">
          {lease.payments.map((payment) => (
            <li key={payment.id} className="p-2 flex justify-between">
              <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
              <span>{payment.amount} Kč</span>
              <span className="text-sm text-gray-600">{payment.note}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


