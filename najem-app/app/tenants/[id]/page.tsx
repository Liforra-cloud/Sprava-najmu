//app/tenants/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X } from 'lucide-react'

type Tenant = {
  id: string
  full_name: string
  email: string
  phone?: string
  personal_id?: string
  address?: string
  employer?: string
  date_registered: string
}

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({
    full_name: '',
    email: '',
    phone: '',
    personal_id: '',
    address: '',
    employer: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/tenants/${id}`)
      .then(res => res.json())
      .then(data => {
        setTenant(data)
        setEditedData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          personal_id: data.personal_id || '',
          address: data.address || '',
          employer: data.employer || ''
        })
      })
  }, [id])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const res = await fetch(`/api/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editedData)
      })

      if (!res.ok) throw new Error('Chyba při ukládání')

      const updated = await res.json()
      setTenant({ ...tenant!, ...updated })
      setSaveSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      alert('Nepodařilo se uložit změnu.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!tenant) return <p>Načítání...</p>

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-4">
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-bold">
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
          title={isEditing ? 'Zrušit úpravu' : 'Upravit informace'}
        >
          {isEditing ? <X size={18} /> : <Pencil size={18} />}
        </button>
      </div>
      <div>
        <strong>E-mail:</strong>{' '}
        {isEditing ? (
          <input
            value={editedData.email}
            onChange={e => setEditedData(d => ({ ...d, email: e.target.value }))}
            className="border px-2 py-1 rounded"
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
        <strong>Rodné číslo / číslo OP:</strong>{' '}
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
