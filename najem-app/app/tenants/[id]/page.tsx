// app/tenants/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Tenant = {
  id: string
  full_name: string
  email: string
  phone?: string
  personal_id?: string
  address?: string
  employer?: string
  note?: string
  date_registered: string
}

export default function TenantDetailPage() {
  const id = (useParams() as Record<string, string>).id
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editedData, setEditedData] = useState({
    full_name: '',
    email: '',
    phone: '',
    personal_id: '',
    address: '',
    employer: '',
    note: '',
  })

  useEffect(() => {
    const fetchTenant = async () => {
      const res = await fetch(`/api/tenants/${id}`)
      if (!res.ok) {
        setTenant(null)
        return
      }
      const data: Tenant = await res.json()
      setTenant(data)
      setEditedData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        personal_id: data.personal_id || '',
        address: data.address || '',
        employer: data.employer || '',
        note: data.note || '',
      })
    }
    fetchTenant()
  }, [id])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const payload = { ...editedData }
      const res = await fetch(`/api/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Chyba při ukládání')
      const updated: Tenant = await res.json()
      setTenant(updated)
      setSaveSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      alert('Nepodařilo se uložit změnu.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Opravdu smazat tohoto nájemníka?')) return
    const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/tenants')
    else alert('Smazání selhalo')
  }

  if (!tenant) return <p>Načítání...</p>

  return (
    <div className="space-y-6 p-6 max-w-xl mx-auto">
      <div className="flex items-center space-x-2">
        <h1 className="text-3xl font-bold">
          {isEditing ? (
            <input
              value={editedData.full_name}
              onChange={e => setEditedData(d => ({ ...d, full_name: e.target.value }))}
              className="border px-2 py-1 rounded text-xl"
            />
          ) : (
            tenant.full_name
          )}
        </h1>
        <button
          onClick={() => {
            setIsEditing(!isEditing)
            setSaveSuccess(false)
          }}
          className="text-blue-600 hover:text-blue-800"
          title={isEditing ? 'Zrušit úpravu' : 'Upravit nájemníka'}
        >
          {isEditing ? 'Zrušit' : 'Upravit'}
        </button>
        <button
          onClick={handleDelete}
          className="ml-2 text-red-600 hover:underline"
        >
          Smazat
        </button>
      </div>

      <div>
        <strong>Email:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.email}
            onChange={e => setEditedData(d => ({ ...d, email: e.target.value }))}
            className="border px-2 py-1 rounded"
            type="email"
          />
        ) : (
          tenant.email
        )}
      </div>

      <div>
        <strong>Telefon:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.phone}
            onChange={e => setEditedData(d => ({ ...d, phone: e.target.value }))}
            className="border px-2 py-1 rounded"
          />
        ) : (
          tenant.phone || '—'
        )}
      </div>

      <div>
        <strong>Rodné číslo:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.personal_id}
            onChange={e => setEditedData(d => ({ ...d, personal_id: e.target.value }))}
            className="border px-2 py-1 rounded"
          />
        ) : (
          tenant.personal_id || '—'
        )}
      </div>

      <div>
        <strong>Adresa:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.address}
            onChange={e => setEditedData(d => ({ ...d, address: e.target.value }))}
            className="border px-2 py-1 rounded"
          />
        ) : (
          tenant.address || '—'
        )}
      </div>

      <div>
        <strong>Zaměstnavatel:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.employer}
            onChange={e => setEditedData(d => ({ ...d, employer: e.target.value }))}
            className="border px-2 py-1 rounded"
          />
        ) : (
          tenant.employer || '—'
        )}
      </div>

      <div>
        <strong>Poznámka:</strong>{' '}
        {isEditing ? (
          <textarea
            value={editedData.note}
            onChange={e => setEditedData(d => ({ ...d, note: e.target.value }))}
            className="border px-2 py-1 rounded w-full"
            rows={2}
            placeholder="Poznámka k nájemníkovi"
          />
        ) : (
          tenant.note || '—'
        )}
      </div>

      <div>
        <strong>Registrován:</strong>{' '}
        {new Date(tenant.date_registered).toLocaleDateString()}
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
