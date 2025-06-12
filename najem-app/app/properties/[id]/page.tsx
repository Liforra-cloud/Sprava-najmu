// app/properties/[id]/page.tsx

'use client'

import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Pencil, X } from 'lucide-react'
import Link from 'next/link'
import dynamicImport from 'next/dynamic'
import DocumentUpload from '@/components/DocumentUpload'

export const dynamic = 'force-dynamic'

const ExpensesList = dynamicImport(() => import('@/components/ExpensesList'), { ssr: false })

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
  description: string | null
  property_type?: string | null
  owner?: string | null
  year_built?: number | null
  total_area?: number | null
  date_added: string
  units: Unit[]
}

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params
  const [property, setProperty] = useState<Property | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({
    name: '',
    address: '',
    description: '',
    property_type: '',
    owner: '',
    year_built: '',
    total_area: '',
    date_added: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Dummy refresh funkce pro build (implementuj později dle potřeby)
  const refreshDokumenty = () => {}

  useEffect(() => {
    const fetchProperty = async () => {
      const res = await fetch(`/api/properties/${id}`, { credentials: 'include' })
      if (!res.ok) {
        notFound()
        return
      }
      const prop = await res.json()
      setProperty(prop)
      setEditedData({
        name: prop.name || '',
        address: prop.address || '',
        description: prop.description || '',
        property_type: prop.property_type || '',
        owner: prop.owner || '',
        year_built: prop.year_built?.toString() || '',
        total_area: prop.total_area?.toString() || '',
        date_added: prop.date_added?.split('T')[0] || ''
      })
    }
    fetchProperty()
  }, [id])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...editedData,
          year_built: editedData.year_built ? parseInt(editedData.year_built) : null,
          total_area: editedData.total_area ? parseFloat(editedData.total_area) : null
        })
      })

      if (!res.ok) throw new Error('Chyba při ukládání')

      const updated = await res.json()
      setProperty({ ...property!, ...updated })
      setSaveSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      alert('Nepodařilo se uložit změnu.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!property) return <p>Načítání...</p>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold">
          {isEditing ? (
            <input
              value={editedData.name}
              onChange={e =>
                setEditedData(d => ({ ...d, name: e.target.value }))
              }
              className="border px-2 py-1 rounded text-xl"
            />
          ) : (
            property.name
          )}
        </h1>
        <button
          onClick={() => {
            setIsEditing(!isEditing)
            setSaveSuccess(false)
          }}
          className="text-blue-600 hover:text-blue-800"
          title={isEditing ? 'Zrušit úpravu' : 'Upravit informace'}
        >
          {isEditing ? <X size={18} /> : <Pencil size={18} />}
        </button>
      </div>

      <div>
        <strong>Adresa:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.address}
            onChange={e =>
              setEditedData(d => ({ ...d, address: e.target.value }))
            }
            className="border px-2 py-1 rounded"
          />
        ) : (
          property.address
        )}
      </div>

      <div>
        <strong>Popis:</strong>{' '}
        {isEditing ? (
          <textarea
            value={editedData.description}
            onChange={e =>
              setEditedData(d => ({ ...d, description: e.target.value }))
            }
            className="border px-2 py-1 rounded w-full"
          />
        ) : (
          property.description || '—'
        )}
      </div>

      <div>
        <strong>Typ nemovitosti:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.property_type}
            onChange={e =>
              setEditedData(d => ({ ...d, property_type: e.target.value }))
            }
            className="border px-2 py-1 rounded"
          />
        ) : (
          property.property_type || '—'
        )}
      </div>

      <div>
        <strong>Vlastník:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.owner}
            onChange={e =>
              setEditedData(d => ({ ...d, owner: e.target.value }))
            }
            className="border px-2 py-1 rounded"
          />
        ) : (
          property.owner || '—'
        )}
      </div>

      <div>
        <strong>Rok kolaudace:</strong>{' '}
        {isEditing ? (
          <input
            type="number"
            value={editedData.year_built}
            onChange={e =>
              setEditedData(d => ({ ...d, year_built: e.target.value }))
            }
            className="border px-2 py-1 rounded"
            min="1800"
            max={new Date().getFullYear()}
          />
        ) : (
          property.year_built || '—'
        )}
      </div>

      <div>
        <strong>Celková plocha (m²):</strong>{' '}
        {isEditing ? (
          <input
            type="number"
            value={editedData.total_area}
            onChange={e =>
              setEditedData(d => ({ ...d, total_area: e.target.value }))
            }
            className="border px-2 py-1 rounded"
            min="0"
            step="0.01"
          />
        ) : (
          property.total_area || '—'
        )}
      </div>

      <div>
        <strong>Přidáno:</strong>{' '}
        {isEditing ? (
          <input
            type="date"
            value={editedData.date_added}
            onChange={e =>
              setEditedData(d => ({ ...d, date_added: e.target.value }))
            }
            className="border px-2 py-1 rounded"
          />
        ) : (
          new Date(property.date_added).toLocaleDateString()
        )}
      </div>

      {isEditing && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-2 px-4 py-1 bg-blue-600 text-white rounded"
        >
          {isSaving ? 'Ukládám...' : 'Uložit změny'}
        </button>
      )}

      {saveSuccess && (
        <p className="text-green-600 font-medium">✅ Změny byly uloženy.</p>
      )}

      {/* Nadpis + tlačítko */}
      <div className="flex items-center gap-4 mt-4">
        <h2 className="text-2xl font-semibold">Jednotky</h2>
        <Link
          href={`/units/new?propertyId=${property.id}`}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-base"
        >
          Přidat jednotku
        </Link>
      </div>

      <ul className="space-y-2 mb-6">
        {property.units?.map((unit: Unit) => (
          <li key={unit.id} className="border p-4 rounded flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <p><strong>Identifikátor:</strong> {unit.identifier}</p>
              <p><strong>Podlaží:</strong> {unit.floor}</p>
              <p><strong>Dispozice:</strong> {unit.disposition}</p>
              <p><strong>Rozloha:</strong> {unit.area} m²</p>
              <p><strong>Stav obsazenosti:</strong> {unit.occupancy_status}</p>
              <p><strong>Nájem:</strong> {unit.monthly_rent} Kč</p>
              <p><strong>Kauce:</strong> {unit.deposit} Kč</p>
              <p><strong>Přidáno:</strong> {new Date(unit.date_added).toLocaleDateString()}</p>
            </div>
            <Link href={`/units/${unit.id}`}>
              <button className="mt-2 md:mt-0 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Editovat
              </button>
            </Link>
          </li>
        ))}
      </ul>

      {/* --- Náklady k nemovitosti --- */}
<ExpensesList unitId={id} propertyId={form.property_id} />
{/* --- Dokumenty k jednotce --- */}
<DocumentUpload unitId={id} onUpload={refreshDokumenty} />

    </div>
  )
}
