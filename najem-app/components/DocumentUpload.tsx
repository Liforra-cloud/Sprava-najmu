// components/DocumentUpload.tsx

'use client'

import { useState, FormEvent } from 'react'

type Props = {
  propertyId?: string
  unitId?: string
  tenantId?: string
  expenseId?: string
  /** Zavolá se s URL po úspěšném nahrání */
  onUpload?: (url: string) => void
}

export default function DocumentUpload({
  propertyId,
  unitId,
  tenantId,
  expenseId,
  onUpload,
}: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!file) {
      setError('Vyberte soubor!')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    if (name) formData.append('name', name)
    if (date) formData.append('date', date)
    if (propertyId) formData.append('property_id', propertyId)
    if (unitId) formData.append('unit_id', unitId)
    if (tenantId) formData.append('tenant_id', tenantId)
    if (expenseId) formData.append('lease_id', expenseId)

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        const url = data.publicUrl as string  // předpokládáme, že API vrací publicUrl
        setSuccess(true)
        setFile(null)
        setName('')
        setDate(new Date().toISOString().slice(0, 10))
        onUpload?.(url)
      } else {
        const data = await res.json()
        setError(data.error || 'Chyba při nahrávání.')
      }
    } catch {
      setError('Chyba při odesílání.')
    }
    setUploading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border p-4 rounded bg-gray-50 max-w-lg">
      <div>
        <label className="block mb-1 font-medium">Soubor</label>
        <input
          type="file"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="block"
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Popis / Název</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="např. smlouva, revize..."
          className="w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Datum</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>
      <button
        type="submit"
        disabled={uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {uploading ? 'Nahrávám...' : 'Nahrát dokument'}
      </button>
      {success && <div className="text-green-600">✅ Dokument byl nahrán.</div>}
      {error && <div className="text-red-600">{error}</div>}
    </form>
  )
}
