// app/properties/[id]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Unit = {
  id: string
  identifier: string
  floor: number
  disposition: string
  area: number
  occupancy_status: string
  monthly_rent: number
  deposit: number
  date_added: string
}

type PropertyWithUnits = {
  id: string
  name: string
  address: string
  description?: string
  date_added?: string
  units: Unit[]
}

export default function PropertyDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [prop, setProp] = useState<PropertyWithUnits | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/properties/${id}`)
      .then(res => res.json())
      .then((data: PropertyWithUnits) => {
        if (data.error) throw new Error(data.error)
        setProp(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="p-6">Načítám…</p>
  if (error)  return <p className="p-6 text-red-600">{error}</p>
  if (!prop)  return null

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold">{prop.name}</h1>
      <p className="text-gray-600">{prop.address}</p>
      {prop.description && <p className="mt-2">{prop.description}</p>}
      {prop.date_added && (
        <p className="text-sm text-gray-500">
          Přidáno: {new Date(prop.date_added).toLocaleDateString('cs-CZ')}
        </p>
      )}

      <h2 className="mt-8 text-2xl font-semibold">Jednotky</h2>
      <ul className="mt-4 space-y-4">
        {prop.units.map(u => (
          <li key={u.id} className="p-4 border rounded">
            <strong>{u.identifier}</strong> (podlaží {u.floor})<br/>
            Dispozice: {u.disposition}<br/>
            Plocha: {u.area} m²<br/>
            Stav: {u.occupancy_status}<br/>
            Nájem: {u.monthly_rent} Kč<br/>
            Kauce: {u.deposit} Kč<br/>
            Přidáno: {new Date(u.date_added).toLocaleDateString('cs-CZ')}
          </li>
        ))}
      </ul>
    </div>
  )
}
