// najem-app/app/leases/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Lease = {
  id: string
  unit: { identifier: string }
  tenant: { name: string }
  startDate: string
  endDate: string | null
  rentAmount: number
  monthlyWater: number
  monthlyGas: number
  monthlyElectricity: number
  monthlyServices: number
}

export default function LeaseDetailPage() {
  const { id } = useParams() as { id: string }
  const [lease, setLease] = useState<Lease | null>(null)

  useEffect(() => {
    const fetchLease = async () => {
      const res = await fetch(`/api/leases/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setLease(data)
    }
    fetchLease()
  }, [id])

  if (!lease) return <p>Načítám smlouvu...</p>

  const total = lease.rentAmount + lease.monthlyWater + lease.monthlyGas + lease.monthlyElectricity + lease.monthlyServices

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Detail smlouvy</h1>

      <div className="space-y-2">
        <p><strong>Jednotka:</strong> {lease.unit.identifier}</p>
        <p><strong>Nájemník:</strong> {lease.tenant.name}</p>
        <p><strong>Začátek nájmu:</strong> {new Date(lease.startDate).toLocaleDateString()}</p>
        <p><strong>Konec nájmu:</strong> {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : '—'}</p>

        <h2 className="text-xl font-semibold mt-4">Měsíční náklady</h2>
        <ul className="list-disc ml-6">
          <li>Nájem: {lease.rentAmount} Kč</li>
          <li>Voda: {lease.monthlyWater} Kč</li>
          <li>Plyn: {lease.monthlyGas} Kč</li>
          <li>Elektřina: {lease.monthlyElectricity} Kč</li>
          <li>Služby: {lease.monthlyServices} Kč</li>
        </ul>

        <p className="mt-3 font-bold">Celkem za měsíc: {total} Kč</p>
      </div>
    </div>
  )
}
