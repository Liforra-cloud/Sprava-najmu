// app/properties/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default async function Page(props: any) {
  const { id } = props.params
  const { data: property, error } = await supabase
    .from('properties')
    .select('id,name,address,description,date_added')
    .eq('id', id)
    .single()

  if (error || !property) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-3xl font-bold mb-4">{property.name}</h1>
      <p className="text-gray-600 mb-2">{property.address}</p>
      {property.description && <p className="mb-4">{property.description}</p>}
      {property.date_added && (
        <p className="text-sm text-gray-500 mb-4">
          Přidáno: {new Date(property.date_added).toLocaleDateString('cs-CZ')}
        </p>
      )}
      <div className="flex gap-2">
        <Link href="/properties">
          <button className="px-4 py-2 bg-gray-200 rounded">Zpět na seznam</button>
        </Link>
      </div>
    </div>
  )
}
