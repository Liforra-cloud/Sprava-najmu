// app/properties/[id]/page.tsx

import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface PropertyPageProps {
  params: {
    id: string
  }
}

interface Unit {
  id: number
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
  description: string | null
  date_added: string
  units: Unit[]
}

export default async function Page({ params }: PropertyPageProps) {
  const { id } = params

  const { data: prop, error } = await supabase
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
    .single<Property>()

  if (error || !prop) {
    console.error(error)
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">{prop.name}</h1>
      <p><strong>Adresa:</strong> {prop.address}</p>
      <p><strong>Popis:</strong> {prop.description || '—'}</p>
      <p><strong>Přidáno:</strong> {new Date(prop.date_added).toLocaleDateString()}</p>

      <h2 className="text-2xl font-semibold mt-4">Jednotky</h2>
      <ul className="space-y-2">
        {prop.units?.map((unit: Unit) => (
          <li key={unit.id} className="border p-4 rounded">
            <p><strong>Identifikátor:</strong> {unit.identifier}</p>
            <p><strong>Podlaží:</strong> {unit.floor}</p>
            <p><strong>Dispozice:</strong> {unit.disposition}</p>
            <p><strong>Rozloha:</strong> {unit.area} m²</p>
            <p><strong>Stav obsazenosti:</strong> {unit.occupancy_status}</p>
            <p><strong>Nájem:</strong> {unit.monthly_rent} Kč</p>
            <p><strong>Kauce:</strong> {unit.deposit} Kč</p>
            <p><strong>Přidáno:</strong> {new Date(unit.date_added).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
