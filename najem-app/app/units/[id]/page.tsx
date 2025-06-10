// app/units/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Unit {
  id: string
  property_id: string
  identifier: string
  floor: number | null
  disposition: string | null
  area: number | null
  occupancy_status: string
  monthly_rent: number | null
  deposit: number | null
  description: string | null
  date_added: string
}

interface Property {
  id: string
  name: string
}

export default function EditUnitPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [unit, setUnit] = useState<Unit | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Načíst jednotku i seznam nemovitostí
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/units/${id}`).then(r => r.json()),
      fetch('/api/properties').then(r => r.json())
    ])
      .then(([unitData, propertiesData]) => {
        if (unitData.error) throw new Error(unitData.error)
        setUnit(unitData)
        setForm({
          property_id: unitData.property_id,
          identifier: unitData.identifier,
          floor: unitData.floor || '',
          disposition: unitData.disposition || '',
          area: unitData.area || '',
          occupancy_status: unitData.occupancy_status,
          monthly_rent: unitData.monthly_rent || '',
          deposit: unitData.deposit || '',
          description: unitData.description || '',
        })
        setProperties(propertiesData)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/units/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    })
    if (res.ok) {
      router.refresh()
      setSaving(false)
    } else {
      const { error } = await res.json()
      setError(error || 'Nepodařilo se uložit jednotku.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Opravdu chcete jednotku smazat?')) return
    setDeleteLoading(true)
    const res = await fetch(`/api/units/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (res.ok) {
      router.push('/units')
    } else {
      const { error } = await res.json()
      setError(error || 'Nepodařilo se jednotku smazat.')
      setDeleteLoading(false)
    }
  }

  if (loading) return <div className="p-8">Načítání…</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>
  if (!unit) return <div className="p-8 text-red-600">Jednotka nenalezena.</div>

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Editace jednotky</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="property_id" className="block text-sm font-medium text-gray-700">
            Nemovitost
          </label>
          <select
            id="property_id"
            name="property_id"
            value={form.property_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            required
          >
            <option value="">Vyberte nemovitost</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
            Označení jednotky
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            value={form.identifier}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
            Podlaží
          </label>
          <input
            id="floor"
            name="floor"
            type="number"
            value={form.floor}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            min={0}
          />
        </div>
        <div>
          <label htmlFor="disposition" className="block text-sm font-medium text-gray-700">
            Dispozice
          </label>
          <input
            id="disposition"
            name="disposition"
            type="text"
            value={form.disposition}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700">
            Rozloha (m²)
          </label>
          <input
            id="area"
            name="area"
            type="number"
            step="0.01"
            value={form.area}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            min={0}
          />
        </div>
        <div>
          <label htmlFor="occupancy_status" className="block text-sm font-medium text-gray-700">
            Stav obsazenosti
          </label>
          <select
            id="occupancy_status"
            name="occupancy_status"
            value={form.occupancy_status}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            required
          >
            <option value="volné">Volné</option>
            <option value="pronajaté">Pronajaté</option>
            <option value="rezervované">Rezervované</option>
          </select>
        </div>
        <div>
          <label htmlFor="monthly_rent" className="block text-sm font-medium text-gray-700">
            Nájem (Kč)
          </label>
          <input
            id="monthly_rent"
            name="monthly_rent"
            type="number"
            step="0.01"
            value={form.monthly_rent}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            min={0}
          />
        </div>
        <div>
          <label htmlFor="deposit" className="block text-sm font-medium text-gray-700">
            Kauce (Kč)
          </label>
          <input
            id="deposit"
            name="deposit"
            type="number"
            step="0.01"
            value={form.deposit}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            min={0}
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Popis
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            rows={2}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {saving ? 'Ukládám...' : 'Uložit změny'}
        </button>
      </form>
      <hr className="my-6" />
      <button
        onClick={handleDelete}
        disabled={deleteLoading}
        className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
      >
        {deleteLoading ? 'Mažu...' : 'Smazat jednotku'}
      </button>
      {error && <div className="text-red-600 mt-4">{error}</div>}
    </div>
  )
}


