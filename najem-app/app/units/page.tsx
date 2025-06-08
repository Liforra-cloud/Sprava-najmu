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
          property:properties (
            name
          )
        `)

      if (error) {
        console.error('Chyba při načítání jednotek:', error)
      } else {
        setUnits(data as Unit[])
      }

      setLoading(false)
    }

    fetchUnits()
  }, [])

  if (loading) return <div className="p-6">Načítání jednotek...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jednotky</h1>
        <Link
          href="/units/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Přidat jednotku
        </Link>
      </div>

      {units.length === 0 ? (
        <p>Žádné jednotky zatím neexistují.</p>
      ) : (
        <table className="w-full table-auto border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">Nemovitost</th>
              <th className="border px-3 py-2 text-left">Identifikátor</th>
              <th className="border px-3 py-2 text-left">Dispozice</th>
              <th className="border px-3 py-2 text-left">Podlaží</th>
              <th className="border px-3 py-2 text-left">Výmera</th>
              <th className="border px-3 py-2 text-left">Nájem</th>
              <th className="border px-3 py-2 text-left">Kauce</th>
              <th className="border px-3 py-2 text-left">Stav</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <td className="border px-3 py-2">{unit.property?.name || '-'}</td>
                <td className="border px-3 py-2">{unit.identifier}</td>
                <td className="border px-3 py-2">{unit.disposition || '-'}</td>
                <td className="border px-3 py-2">{unit.floor ?? '-'}</td>
                <td className="border px-3 py-2">{unit.area ?? '-'} m²</td>
                <td className="border px-3 py-2">
                  {unit.monthly_rent ? `${unit.monthly_rent} Kč` : '-'}
                </td>
                <td className="border px-3 py-2">
                  {unit.deposit ? `${unit.deposit} Kč` : '-'}
                </td>
                <td className="border px-3 py-2">{unit.occupancy_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
