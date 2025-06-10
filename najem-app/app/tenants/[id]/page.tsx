//app/tenants/[id]/page.tsx

// app/tenants/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Guarantor = {
  name: string
  [key: string]: any
}

type Tenant = {
  id: string
  full_name: string
  email: string
  phone?: string
  personal_id?: string
  address?: string
  employer?: string
  guarantors?: Guarantor[]
  date_registered: string
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
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
    guarantors: '',
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
        guarantors: data.guarantors ? JSON.stringify(data.guarantors) : '',
      })
    }
    fetchTenant()
  }, [id])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      let parsedGuarantors: Guarantor[] | undefined = undefined
      if (editedData.guarantors) {
        try {
          parsedGuarantors = JSON.parse(editedData.guarantors)
        } catch {
          alert('Rušitelé musí být validní JSON pole.')
          setIsSaving(false)
          return
        }
      }

      const payload: Omit<Tenant, 'id' | 'date_registered'> = {
        full_name: editedData.full_name,
        email: editedData.email,
        phone: editedData.phone,
        personal_id: editedData.personal_id,
        address: editedData.address,
        employer: editedData.employer,
        guarantors: parsedGuarantors,
      }

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
        <strong>Rušitelé (JSON pole):</strong>{' '}
        {isEditing ? (
          <textarea
            value={editedData.guarantors}
            onChange={e => setEditedData(d => ({ ...d, guarantors: e.target.value }))}
            className="border px-2 py-1 rounded w-full"
            rows={2}
            placeholder='Např. [{"name":"Jan Novák"}]'
          />
        ) : (
          tenant.guarantors ? JSON.stringify(tenant.guarantors) : '—'
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
