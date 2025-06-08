// app/properties/[id]/page.tsx
import { supabase } from '@/lib/supabaseClient'
import { notFound } from 'next/navigation'

interface Unit { /* ... */ }
interface Property { /* ... */ }

interface PageParams { params: { id: string } }

export default async function Page({ params: { id } }: PageParams) {
  // Načtení dat na serveru
  const { data: prop, error } = await supabase
    .from('properties')
    .select(`
      id, name, address, description, date_added,
      units (
        id, identifier, floor, disposition, area,
        occupancy_status, monthly_rent, deposit, date_added
      )
    `)
    .eq('id', id)
    .single()

  if (error || !prop) notFound()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{prop.name}</h1>
      {/* … ostatní zobrazení … */}
    </div>
  )
}
