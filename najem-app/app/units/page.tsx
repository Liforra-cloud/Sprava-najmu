'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Unit {
  id: string
  identifier: string
  floor: number | null
  disposition: string | null
  area: number | null
  occupancy_status: string
  monthly_rent: number | null
  deposit: number | null
  date_added: string
  property: {
    name: string
  }
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUnits = async () => {
      const { data, error } = await supabase
        .from('units')
        .select(`
          id,
          identifier,
          floor,
          disposition,
          area,
          occupancy_status,
          monthly_rent,
          deposit,
          date_added,
          property (
            name
          )
        `)

      if (error) {
        console.error('Chyba při načítání jednotek:', error)
      } else {
        // Oprav typovou chybu přetypováním na očekávanou strukturu
        setUnits(data as unknown as Unit[])
      }
      setLoading(false)
    }

    fetchUnits()
  }, [])

  if (loading) return <p>Načítám jednotky...</p>

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Seznam jednotek</h1>
        <Link
          href="/units/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Přidat jednotku
        </Link>
      </div>

      {units.length === 0 ? (
        <p>Žádné jednotky nenalezeny.</p>
      ) : (
        <ul className="space-y-3">
          {units.map((unit) => (
            <li key={unit.id} className="border rounded p-4 shadow-sm">
              <p><strong>Nemovitost:</strong> {unit.property?.name || 'Neznámá'}</p>
              <p><strong>Identifikátor:</strong> {unit.identifier}</p>
              <p><strong>Podlaží:</strong> {unit.floor ?? '—'}</p>
              <p><strong>Dispozice:</strong> {unit.disposition ?? '—'}</p>
              <p><strong>Výmera:</strong> {unit.area ? `${unit.area} m²` : '—'}</p>
              <p><strong>Stav obsazenosti:</strong> {unit.occupancy_status}</p>
              <p><strong>Nájem:</strong> {unit.monthly_rent ? `${unit.monthly_rent} Kč` : '—'}</p>
              <p><strong>Kauce:</strong> {unit.deposit ? `${unit.deposit} Kč` : '—'}</p>
              <p><strong>Přidáno:</strong> {new Date(unit.date_added).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
