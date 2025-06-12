// /components/DocumentUpload.tsx

'use client'
import { useEffect, useState } from 'react'

type Props = {
  propertyId?: string
  unitId?: string
  expenseId?: string
  tenantId?: string
  onChange?: () => void
}

type Document = {
  id: string
  file_url: string
  file_name: string
  name?: string
  uploaded_at: string
  user_id: string
}

export default function DocumentList({ propertyId, unitId, expenseId, tenantId, onChange }: Props) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [me, setMe] = useState<string | null>(null)

  useEffect(() => {
    // Zjisti id přihlášeného uživatele (pro mazání vlastních dokumentů)
    fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user?.id || null)).catch(() => setMe(null))
  }, [])

  useEffect(() => {
    setLoading(true)
    let query = `/api/documents?`
    if (propertyId) query += `property_id=${propertyId}&`
    if (unitId) query += `unit_id=${unitId}&`
    if (expenseId) query += `expense_id=${expenseId}&`
    if (tenantId) query += `tenant_id=${tenantId}&`
    fetch(query)
      .then(res => res.json())
      .then(data => {
        setDocuments(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setError('Nepodařilo se načíst dokumenty')
        setLoading(false)
      })
  }, [propertyId, unitId, expenseId, tenantId, onChange])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Opravdu smazat tento dokument?')) return
    const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDocuments(docs => docs.filter(doc => doc.id !== id))
      if (onChange) onChange()
    } else {
      alert('Chyba při mazání!')
    }
  }

  if (loading) return <div>Načítání…</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (documents.length === 0) return <div>Žádné dokumenty</div>

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">Seznam dokumentů</h3>
      <ul>
        {documents.map(doc => (
          <li key={doc.id} className="mb-2 flex items-center gap-3">
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline"
            >
              {doc.name || doc.file_name}
            </a>
            <span className="text-xs text-gray-500">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
            {/* Smazat jen když patří přihlášenému uživateli */}
            {me && doc.user_id === me && (
              <button
                onClick={() => handleDelete(doc.id)}
                className="text-red-600 text-xs border px-2 rounded hover:bg-red-50"
              >
                Smazat
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
