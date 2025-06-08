// app/properties/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Property = {
  id: string
  name: string
  address: string
  description?: string
  date_added?: string
}

async function fetchProperty(id: string): Promise<Property> {
  const res = await fetch(`/api/properties/${id}`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Nemovitost nenalezena')
  }
  return res.json()
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  let property: Property

  try {
    property = await fetchProperty(params.id)
  } catch {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-3xl font-bold mb-4">{property.name}</h1>
      <p className="text-gray-600 mb-2">{property.address}</p>
      {property.description && (
        <p className="mb-4">{property.description}</p>
      )}
      {property.date_added && (
        <p className="text-sm text-gray-500 mb-4">
          Přidáno: {new Date(property.date_added).toLocaleDateString('cs-CZ')}
        </p>
      )}
      <div className="flex gap-2">
        <Link href="/properties">
          <button className="px-4 py-2 bg-gray-200 rounded">Zpět na seznam</button>
        </Link>
        <Link href={`/properties/${property.id}/edit`}>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Upravit</button>
        </Link>
      </div>
    </div>
  )
}
