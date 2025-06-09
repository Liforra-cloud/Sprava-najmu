'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface Unit {
  id: string
  identifier: string
  floor: number | null
  disposition: string
  area: number | null
  occupancy_status: string | null
  monthly_rent: number | null
  deposit: number | null
  date_added: string
  property: {
    name: string
  } | null
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
      } else if (data) {
        setUnits(data)
      }

      setLoading(false)
    }

    fetchUnits()
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jednotky</h1>
        <Link
          href="/units/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Přidat jednotku
        </Link>
      </div>

      {loading ? (
        <p>Načítání...</p>
      ) : units.length === 0 ? (
        <p>Žádné jednotky nenalezeny.</p>
      ) : (
        <table className="min-w-full table-auto border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Identifikátor</th>
              <th className="border p-2 text-left">Nemovitost</th>
              <th className="border p-2 text-left">Podlaží</th>
              <th className="border p-2 text-left">Dispozice</th>
              <th className="border p-2 text-left">Výmera</th>
              <th className="border p-2 text-left">Nájem</th>
              <th className="border p-2 text-left">Kauce</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <td className="border p-2">{unit.identifier}</td>
                <td className="border p-2">{unit.property?.name ?? '-'}</td>
                <td className="border p-2">{unit.floor ?? '-'}</td>
                <td className="border p-2">{unit.disposition}</td>
                <td className="border p-2">{unit.area ?? '-'} m²</td>
                <td className="border p-2">{unit.monthly_rent?.toLocaleString() ?? '-'} Kč</td>
                <td className="border p-2">{unit.deposit?.toLocaleString() ?? '-'} Kč</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
