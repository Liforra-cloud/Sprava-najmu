// app/units/[id]/page.tsx

'use client'

import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Pencil, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Unit {
  id: string
  property_id: string
  identifier: string
  floor: number | null
  disposition: string | null
  area: number | null
  occupancy_status: string
  monthly_rent: number | null
  deposit: number | null
  date_added: string
  description: string | null
}

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params
  const [unit, setUnit] = useState<Unit | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({
    identifier: '',
    floor: '',
    disposition: '',
    area: '',
    occupancy_status: 'volné',
    monthly_rent: '',
    deposit: '',
    description: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Enum options - uprav dle skutečných enum hodnot z DB
  const occupancyOptions = [
    { value: 'volné', label: 'Volné' },
    { value: 'obsazené', label: 'Obsazené' },
    { value: 'rezervováno', label: 'Rezervováno' }
  ]

  useEffect(() => {
    const fetchUnit = async () => {
      const res = await fetch(`/api/units/${id}`, { credentials: 'include' })
      if (!res.ok) {
        notFound()
        return
      }
      const unit = await res.json()
      setUnit(unit)
      setEditedData({
        identifier: unit.identifier || '',
        floor: unit.floor !== null && unit.floor !== undefined ? String(unit.floor) : '',
        disposition: unit.disposition || '',
        area: unit.area !== null && unit.area !== undefined ? String(unit.area) : '',
        occupancy_status: unit.occupancy_status || 'volné',
        monthly_rent: unit.monthly_rent !== null && unit.monthly_rent !== undefined ? String(unit.monthly_rent) : '',
        deposit: unit.deposit !== null && unit.deposit !== undefined ? String(unit.deposit) : '',
        description: unit.description || '',
      })
    }
    fetchUnit()
  }, [id])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const res = await fetch(`/api/units/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...editedData,
          floor: editedData.floor !== '' ? Number(editedData.floor) : null,
          area: editedData.area !== '' ? Number(editedData.area) : null,
          monthly_rent: editedData.monthly_rent !== '' ? Number(editedData.monthly_rent) : null,
          deposit: editedData.deposit !== '' ? Number(editedData.deposit) : null,
        })
      })
      if (!res.ok) throw new Error('Chyba při ukládání')
      const updated = await res.json()
      setUnit({ ...unit!, ...updated })
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

  if (!unit) return <p>Načítání...</p>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold">
          {isEditing ? (
            <input
              value={editedData.identifier}
              onChange={e => setEditedData(d => ({ ...d, identifier: e.target.value }))}
              className="border px-2 py-1 rounded text-xl"
            />
          ) : (
            unit.identifier
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
        <strong>Podlaží:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.floor}
            onChange={e => setEditedData(d => ({ ...d, floor: e.target.value }))}
            className="border px-2 py-1 rounded"
            type="number"
          />
        ) : (
          unit.floor !== null && unit.floor !== undefined ? unit.floor : '—'
        )}
      </div>

      <div>
        <strong>Dispozice:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.disposition}
            onChange={e => setEditedData(d => ({ ...d, disposition: e.target.value }))}
            className="border px-2 py-1 rounded"
          />
        ) : (
          unit.disposition || '—'
        )}
      </div>

      <div>
        <strong>Rozloha:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.area}
            onChange={e => setEditedData(d => ({ ...d, area: e.target.value }))}
            className="border px-2 py-1 rounded"
            type="number"
          />
        ) : (
          unit.area !== null && unit.area !== undefined ? `${unit.area} m²` : '—'
        )}
      </div>

      <div>
        <strong>Stav obsazenosti:</strong>{' '}
        {isEditing ? (
          <select
            value={editedData.occupancy_status}
            onChange={e => setEditedData(d => ({ ...d, occupancy_status: e.target.value }))}
            className="border px-2 py-1 rounded"
          >
            {occupancyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          unit.occupancy_status || '—'
        )}
      </div>

      <div>
        <strong>Nájem:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.monthly_rent}
            onChange={e => setEditedData(d => ({ ...d, monthly_rent: e.target.value }))}
            className="border px-2 py-1 rounded"
            type="number"
          />
        ) : (
          unit.monthly_rent !== null && unit.monthly_rent !== undefined ? `${unit.monthly_rent} Kč` : '—'
        )}
      </div>

      <div>
        <strong>Kauce:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.deposit}
            onChange={e => setEditedData(d => ({ ...d, deposit: e.target.value }))}
            className="border px-2 py-1 rounded"
            type="number"
          />
        ) : (
          unit.deposit !== null && unit.deposit !== undefined ? `${unit.deposit} Kč` : '—'
        )}
      </div>

      <div>
        <strong>Popis:</strong>{' '}
        {isEditing ? (
          <textarea
            value={editedData.description}
            onChange={e => setEditedData(d => ({ ...d, description: e.target.value }))}
            className="border px-2 py-1 rounded w-full"
            rows={2}
          />
        ) : (
          unit.description || '—'
        )}
      </div>

      <div>
        <strong>Přidáno:</strong>{' '}
        {unit.date_added ? new Date(unit.date_added).toLocaleDateString() : '—'}
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
    </div>
  )
}

