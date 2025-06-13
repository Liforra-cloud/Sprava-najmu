//components/DocumentList.tsx

'use client'

import { useEffect, useState } from 'react'

type Document = {
  id: string
  file_name: string
  name?: string
  date?: string
}

function DocumentViewer({ docId, fileName }: { docId: string, fileName?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/documents/${docId}/signed-url`)
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setUrl(data.url)
          setMimeType(data.mimeType)
        } else {
          setError(data.error || "Chyba při získávání URL")
        }
      })
      .catch(() => setError("Chyba při získávání URL"))
      .finally(() => setLoading(false))
  }, [docId])

  if (loading) return <span className="text-xs text-gray-400">Načítám…</span>
  if (error) return <span className="text-xs text-red-400">{error}</span>
  if (!url) return null

  // Obrázek
  if (mimeType?.startsWith('image/')) {
    return <a href={url} target="_blank" rel="noopener noreferrer" title="Otevřít obrázek">
      <img src={url} alt={fileName} className="h-10 rounded shadow" />
    </a>
  }
  // PDF
  if (mimeType === "application/pdf") {
    return <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{fileName || 'PDF dokument'}</a>
  }
  // Ostatní
  return <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline" download={fileName}>
    {fileName || 'Stáhnout dokument'}
  </a>
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/documents')
      .then(r => r.json())
      .then(docs => setDocuments(Array.isArray(docs) ? docs : []))
      .catch(() => setError('Chyba při načítání dokumentů.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-500">Načítám dokumenty...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (documents.length === 0) return <div className="text-gray-500">Žádné dokumenty</div>

  return (
    <div className="mt-2">
      <ul className="space-y-2">
        {documents.map(doc => (
          <li key={doc.id} className="flex items-center gap-3 border p-2 rounded bg-white shadow-sm">
            <DocumentViewer docId={doc.id} fileName={doc.name || doc.file_name} />
            <span className="ml-2 text-sm">{doc.name || doc.file_name}</span>
            {doc.date && <span className="text-xs text-gray-500">({doc.date})</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
