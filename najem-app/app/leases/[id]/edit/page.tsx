// najem-app/app/leases/[id]/edit/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function EditLeasePage() {
  const { id } = useParams()
  const router = useRouter()
  const [lease, setLease] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLease = async () => {
      const res = await fetch(`/api/leases/${id}`)
      if (!res.ok) {
        setError('Nepodařilo se načíst data.')
        return
      }
      const data = await res.json()
      setLease(data)
      setLoading(false)
    }
    fetchLease()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch(`/api/leases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lease),
    })

    if (res.ok) {
      router.push(`/leases/${id}`)
    } else {
      const err = await res.json()
      setError(err.error || 'Chyba při ukládání změn.')
    }
  }

  if (loading) return <p>Načítání...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!lease) return <p>Smlouva nebyla nalezena</p>

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Upravit smlouvu</h1>

      <label className="block">
        Název:
        <input
          className="border w-full p-2 rounded"
          value={lease.name || ''}
          onChange={(e) => setLease({ ...lease, name: e.target.value })}
        />
      </label>

      <label className="block">
        Datum začátku:
        <input
          type="date"
          className="border w-full p-2 rounded"
          value={lease.start_date?.slice(0, 10)}
          onChange={(e) => setLease({ ...lease, start_date: e.target.value })}
        />
      </label>

      <label className="block">
        Datum konce:
        <input
          type="date"
          className="border w-full p-2 rounded"
          value={lease.end_date?.slice(0, 10) || ''}
          onChange={(e) => setLease({ ...lease, end_date: e.target.value })}
        />
      </label>

      <label className="block">
        Měsíční nájem:
        <input
          type="number"
          className="border w-full p-2 rounded"
          value={lease.rent_amount || ''}
          onChange={(e) => setLease({ ...lease, rent_amount: Number(e.target.value) })}
        />
      </label>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Uložit změny
      </button>
    </form>
  )
}
