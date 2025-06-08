// app/properties/[id]/page.tsx

import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default async function Page({
  params,
  searchParams: _searchParams, // <- tuhle props sice nepotřebuješ, ale musíš ji mít
}: {
  params: { id: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
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
    .single()

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

      <h2 className="text-2xl font-semibold mt-8">Jednotky</h2>
      <div className="space-y-4">
        {prop.units.length === 0 && <p>Žádné jednotky</p>}
        {prop.units.map(u => (
          <div key={u.id} className="border rounded p-4">
            <p><strong>Číslo:</strong> {u.identifier}</p>
            <p><strong>Podlaží:</strong> {u.floor}</p>
            <p><strong>Dispozice:</strong> {u.disposition}</p>
            <p><strong>Plocha:</strong> {u.area} m²</p>
            <p><strong>Stav:</strong> {u.occupancy_status}</p>
            <p><strong>Nájem:</strong> {u.monthly_rent} CZK</p>
            <p><strong>Kauce:</strong> {u.deposit} CZK</p>
            <p><strong>Přidáno:</strong> {new Date(u.date_added).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
