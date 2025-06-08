'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

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
          property ( name )
        `)
        .order('date_added', { ascending: false })

      if (error) {
        console.error('Chyba při načítání jednotek:', error)
      } else {
        setUnits(data)
      }
      setLoading(false)
    }

    fetchUnits()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Jednotky</h1>
        <Link
          href="/units/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Přidat jednotku
        </Link>
      </div>

      {loading ? (
        <p>Načítání...</p>
      ) : units.length === 0 ? (
        <p>Nemáte žádné jednotky.</p>
      ) : (
        <ul className="space-y-4">
          {units.map((unit) => (
            <li key={unit.id} className="border p-4 rounded shadow-sm bg-white">
              <p><strong>Identifikátor:</strong> {unit.identifier}</p>
              <p><strong>Nemovitost:</strong> {unit.property?.name}</p>
              <p><strong>Podlaží:</strong> {unit.floor ?? '—'}</p>
              <p><strong>Dispozice:</strong> {unit.disposition ?? '—'}</p>
              <p><strong>Rozloha:</strong> {unit.area ? `${unit.area} m²` : '—'}</p>
              <p><strong>Stav:</strong> {unit.occupancy_status}</p>
              <p><strong>Nájem:</strong> {unit.monthly_rent ?? '—'} Kč</p>
              <p><strong>Kauce:</strong> {unit.deposit ?? '—'} Kč</p>
              <p><strong>Přidáno:</strong> {new Date(unit.date_added).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
