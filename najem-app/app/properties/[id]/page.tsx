'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Unit = { /* ... */ }
type Property = { /* ... */ }

export default function PropertyDetailPage() {
  const { id } = useParams() || {}
  const router = useRouter()

  const [prop, setProp] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            id, name, address, description, date_added,
            units (
              id, identifier, floor, disposition, area,
              occupancy_status, monthly_rent, deposit, date_added
            )
          `)
          .eq('id', id)
          .single()

        if (error) setError(error.message)
        else setProp(data)
      } catch (e: unknown) {
        if (e instanceof Error) setError(e.message)
        else setError(String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div>Načítám...</div>
  if (error)   return <div className="text-red-600">Chyba: {error}</div>
  if (!prop)   return <div>Nemovitost nenalezena.</div>

  return (
    <div className="p-6">
      {/* ...render nemovitosti a jednotek... */}
      <button onClick={() => router.push('/properties')} className="bg-gray-200 px-4 py-2 rounded">
        Zpět na seznam
      </button>
    </div>
  )
}
