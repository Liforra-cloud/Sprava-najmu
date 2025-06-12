/components/DocumentUpload.tsx

'use client'
import { useState } from 'react'

export default function DocumentUpload({ propertyId, unitId, tenantId }: { propertyId?: string, unitId?: string, tenantId?: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [desc, setDesc] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setMessage(null)
    const formData = new FormData()
    formData.append('file', file)
    if (desc) formData.append('description', desc)
    if (propertyId) formData.append('property_id', propertyId)
    if (unitId) formData.append('unit_id', unitId)
    if (tenantId) formData.append('tenant_id', tenantId)

    const res = await fetch('/api/documents', {
      method: 'POST',
      body: formData,
    })
    const result = await res.json()
    if (res.ok) setMessage('Soubor úspěšně nahrán.')
    else setMessage(result.error || 'Chyba při nahrávání.')
    setUploading(false)
  }

  return (
    <form onSubmit={handleUpload} className="space-y-2">
      <input type="file" required onChange={e => setFile(e.target.files?.[0] || null)} />
      <input type="text" placeholder="Popis (volitelně)" value={desc} onChange={e => setDesc(e.target.value)} className="border rounded px-2 py-1" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={uploading}>
        {uploading ? 'Nahrávám...' : 'Nahrát dokument'}
      </button>
      {message && <div>{message}</div>}
    </form>
  )
}
