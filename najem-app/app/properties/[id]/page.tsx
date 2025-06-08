// app/properties/[id]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Unit = {
  id: string
  identifier: string
  floor: number
  disposition: string
  area: number
  occupancy_status: 'volné' | 'obsazené' | 'rezervace'
  monthly_rent: number
  deposit: number
  date_added: string
}

type Property = {
  id: string
  name: string
  address: string
  description: string | null
  date_added: string
  units: Unit[]
}

export default function PropertyDetailPage() {
  const { id } = useParams() ?? {}
  const router = useRouter()

  const [prop, setProp] = useState<Property | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchProperty = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('properties')    // bez generického typu
          .select(`
            id, name, address, description, date_added,
            units (
              id, identifier, floor, disposition, area,
              occupancy_status, monthly_rent, deposit, date_added
            )
          `)
          .eq('id', id)
          .single()

        if (error) {
          setError(error.message)
        } else {
          setProp(data as Property) // ruční přetypování
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  if (loading) return <div>Načítám...</div>
  if (error)   return <div className="text-red-600">Chyba: {error}</div>
  if (!prop)   return <div>Nemovitost nenalezena.</div>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">{prop.name}</h1>
      <p>{prop.address}</p>
      {prop.description && <p>{prop.description}</p>}
      <p>Datum zařazení: {new Date(prop.date_added).toLocaleDateString()}</p>

      <h2 className="text-2xl font-semibold mt-6">Jednotky</h2>
      {prop.units.length > 0 ? (
        <ul className="space-y-2">
          {prop.units.map((u) => (
            <li key={u.id} className="p-4 border rounded">
              <p><strong>{u.identifier}</strong> (podlaží {u.floor})</p>
              <p>{u.disposition}, {u.area} m²</p>
              <p>Stav: {u.occupancy_status}</p>
              <p>Nájem: {u.monthly_rent} Kč</p>
              <p>Kauce: {u.deposit} Kč</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Žádné jednotky.</p>
      )}

      <div className="pt-6">
        <button
          onClick={() => router.push('/properties')}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Zpět na seznam
        </button>
      </div>
    </div>
  )
}
