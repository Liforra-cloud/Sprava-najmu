// app/properties/[id]/page.tsx

'use client'

import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Pencil, X } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
    date_added: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Stav pro přidání jednotky
  const [unitForm, setUnitForm] = useState({
    identifier: '',
    floor: '',
    disposition: '',
    area: '',
    occupancy_status: 'volné',
    monthly_rent: '',
    deposit: '',
    description: '',
  })
  const [addingUnit, setAddingUnit] = useState(false)
  const [addUnitError, setAddUnitError] = useState('')

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
        name: prop.name,
        address: prop.address,
        description: prop.description || '',
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
        body: JSON.stringify(editedData)
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

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingUnit(true)
    setAddUnitError('')

    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        property_id: id,
        identifier: unitForm.identifier,
        floor: unitForm.floor ? Number(unitForm.floor) : null,
        disposition: unitForm.disposition,
        area: unitForm.area ? Number(unitForm.area) : null,
        occupancy_status: unitForm.occupancy_status,
        monthly_rent: unitForm.monthly_rent ? Number(unitForm.monthly_rent) : null,
        deposit: unitForm.deposit ? Number(unitForm.deposit) : null,
        description: unitForm.description,
      }),
    })
    if (res.ok) {
      setUnitForm({
        identifier: '',
        floor: '',
        disposition: '',
        area: '',
        occupancy_status: 'volné',
        monthly_rent: '',
        deposit: '',
        description: '',
      })
      // Reload jednotek v property (nový fetch)
      const propRes = await fetch(`/api/properties/${id}`, { credentials: 'include' })
      if (propRes.ok) {
        setProperty(await propRes.json())
      }
    } else {
      const errorData = await res.json()
      setAddUnitError(errorData.error || 'Nepodařilo se přidat jednotku.')
    }
    setAddingUnit(false)
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

      <h2 className="text-2xl font-semibold mt-4">Jednotky</h2>
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

      {/* Přidávací formulář nové jednotky */}
      <div className="border rounded p-4 bg-gray-50 max-w-lg">
        <h3 className="text-lg font-semibold mb-2">Přidat jednotku</h3>
        <form onSubmit={handleAddUnit} className="space-y-2">
          <div>
            <label className="block text-sm">Označení jednotky*</label>
            <input
              value={unitForm.identifier}
              onChange={e => setUnitForm(f => ({ ...f, identifier: e.target.value }))}
              required
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm">Podlaží</label>
              <input
                type="number"
                value={unitForm.floor}
                onChange={e => setUnitForm(f => ({ ...f, floor: e.target.value }))}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm">Dispozice</label>
              <input
                value={unitForm.disposition}
                onChange={e => setUnitForm(f => ({ ...f, disposition: e.target.value }))}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm">Rozloha (m²)</label>
            <input
              type="number"
              value={unitForm.area}
              onChange={e => setUnitForm(f => ({ ...f, area: e.target.value }))}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm">Stav obsazenosti</label>
            <select
              value={unitForm.occupancy_status}
              onChange={e => setUnitForm(f => ({ ...f, occupancy_status: e.target.value }))}
              className="w-full border rounded px-2 py-1"
            >
              <option value="volné">Volné</option>
              <option value="obsazeno">Obsazeno</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm">Nájem (Kč)</label>
              <input
                type="number"
                value={unitForm.monthly_rent}
                onChange={e => setUnitForm(f => ({ ...f, monthly_rent: e.target.value }))}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm">Kauce (Kč)</label>
              <input
                type="number"
                value={unitForm.deposit}
                onChange={e => setUnitForm(f => ({ ...f, deposit: e.target.value }))}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm">Popis</label>
            <textarea
              value={unitForm.description}
              onChange={e => setUnitForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border rounded px-2 py-1"
              rows={2}
            />
          </div>
          {addUnitError && (
            <p className="text-red-600 text-sm">{addUnitError}</p>
          )}
          <button
            type="submit"
            disabled={addingUnit}
            className="mt-2 px-4 py-1 bg-blue-600 text-white rounded"
          >
            {addingUnit ? 'Přidávám...' : 'Přidat jednotku'}
          </button>
        </form>
      </div>
    </div>
  )
}
