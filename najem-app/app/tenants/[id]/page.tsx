// app/tenants/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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

    const payload: Omit<Tenant, 'id' | 'date_registered'> = {
      full_name: editedData.full_name,
      email: editedData.email,
      phone: editedData.phone,
      personal_id: editedData.personal_id,
      address: editedData.address,
      employer: editedData.employer,
      note: editedData.note,
    }

    try {
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

  if (!tenant) return <p>Načítání...</p>

  return (
    <div className="space-y-6 p-6 max-w-xl mx-auto">
      {/* ...ostatní pole... */}

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
