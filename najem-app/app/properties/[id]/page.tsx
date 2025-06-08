'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface Unit {
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

interface Property {
  id: string
  name: string
  address: string
  description: string
  date_added: string
  units: Unit[]
}

interface Props {
  params: { id: string }
}

export default function PropertyPage({ params: { id } }: Props) {
  const router = useRouter()
  const [prop, setProp] = useState<Property | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
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
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }

    if (id) load()
  }, [id])

  if (loading) return <p>Načítám…</p>
  if (error)   return <p className="text-red-600">Chyba: {error}</p>
  if (!prop)   return <p>Nemovitost nenalezena</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{prop.name}</h1>
      <p><strong>Adresa:</strong> {prop.address}</p>
      <p><strong>Popis:</strong> {prop.description || '–'}</p>
      <p><strong>Datum vložení:</strong> {new Date(prop.date_added).toLocaleDateString()}</p>

      <h2 className="mt-6 text-xl font-semibold">Jednotky</h2>
      {prop.units.length === 0 
        ? <p>Žádné jednotky.</p>
        : (
          <ul className="space-y-2">
            {prop.units.map(u => (
              <li key={u.id} className="border p-4 rounded">
                <p><strong>Číslo:</strong> {u.identifier}</p>
                <p><strong>Podlaží:</strong> {u.floor}</p>
                <p><strong>Dispozice:</strong> {u.disposition}</p>
                <p><strong>Plocha:</strong> {u.area} m²</p>
                <p><strong>Stav:</strong> {u.occupancy_status}</p>
                <p><strong>Nájem:</strong> {u.monthly_rent} Kč</p>
                <p><strong>Kauce:</strong> {u.deposit} Kč</p>
              </li>
            ))}
          </ul>
        )
      }

      <button
        onClick={() => router.push('/properties')}
        className="mt-6 bg-gray-200 px-4 py-2 rounded"
      >
        Zpět na seznam
      </button>
    </div>
  )
}
