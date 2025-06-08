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
  description?: string
  date_added: string
  units: Unit[]
}

export default function PropertyDetailPage() {
  const params = useParams()
  const id = params?.id
  const router = useRouter()

  const [prop, setProp] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            id,
            name,
            address,
            description,
            date_added,
            units (
              id,
              identifier,
              floor,
              disposition,
              area,
              occupancy_status,
              monthly_rent,
              deposit,
              date_added
            )
          `)
          .eq('id', id)
          .single()
        if (error) {
          setError(error.message)
        } else {
          setProp(data)
        }
      } catch (e: any) {
        setError(e.message ?? 'Neznámá chyba')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div>Načítám...</div>
  if (error)   return <div className="text-red-600">Chyba: {error}</div>
  if (!prop)   return <div>Nemovitost nenalezena.</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{prop.name}</h1>
      <p className="mb-2"><strong>Adresa:</strong> {prop.address}</p>
      {prop.description && (
        <p className="mb-4"><strong>Popis:</strong> {prop.description}</p>
      )}
      <p className="mb-6"><strong>Datum zařazení:</strong> {new Date(prop.date_added).toLocaleDateString()}</p>

      <h2 className="text-xl font-semibold mb-3">Jednotky</h2>
      {prop.units.length === 0 ? (
        <p>Žádné jednotky.</p>
      ) : (
        <ul className="space-y-2">
          {prop.units.map(unit => (
            <li key={unit.id} className="p-4 border rounded">
              <p><strong>Číslo jednotky:</strong> {unit.identifier}</p>
              <p><strong>Podlaží:</strong> {unit.floor}</p>
              <p><strong>Dispozice:</strong> {unit.disposition}</p>
              <p><strong>Plocha:</strong> {unit.area} m²</p>
              <p><strong>Stav:</strong> {unit.occupancy_status}</p>
              <p><strong>Nájem:</strong> {unit.monthly_rent} Kč</p>
              <p><strong>Kauce:</strong> {unit.deposit} Kč</p>
              <p><strong>Přidáno:</strong> {new Date(unit.date_added).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
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
