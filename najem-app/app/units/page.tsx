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
  properties: {
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
          properties (
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Seznam jednotek</h1>
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
        <p>Žádné jednotky</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded">
            <thead>
              <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
                <th className="p-3 border-b">Nemovitost</th>
                <th className="p-3 border-b">Identifikátor</th>
                <th className="p-3 border-b">Podlaží</th>
                <th className="p-3 border-b">Dispozice</th>
                <th className="p-3 border-b">Výmera (m²)</th>
                <th className="p-3 border-b">Nájem (Kč)</th>
                <th className="p-3 border-b">Kauce (Kč)</th>
                <th className="p-3 border-b">Stav</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className="text-sm hover:bg-gray-50">
                  <td className="p-3 border-b">{unit.properties?.name ?? 'Neznámá nemovitost'}</td>
                  <td className="p-3 border-b">{unit.identifier}</td>
                  <td className="p-3 border-b">{unit.floor ?? '-'}</td>
                  <td className="p-3 border-b">{unit.disposition ?? '-'}</td>
                  <td className="p-3 border-b">{unit.area ?? '-'}</td>
                  <td className="p-3 border-b">{unit.monthly_rent ?? '-'}</td>
                  <td className="p-3 border-b">{unit.deposit ?? '-'}</td>
                  <td className="p-3 border-b">{unit.occupancy_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
