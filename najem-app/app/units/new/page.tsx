'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NewUnitPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    identifier: '',
    floor: '',
    disposition: '',
    area: '',
    occupancy_status: 'volné',
    monthly_rent: '',
    deposit: '',
    property_id: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('units').insert({
      ...formData,
      floor: Number(formData.floor),
      area: Number(formData.area),
      monthly_rent: Number(formData.monthly_rent),
      deposit: Number(formData.deposit)
    })

    if (error) {
      alert('Chyba při ukládání jednotky')
      console.error(error)
    } else {
      router.push('/units')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Přidat jednotku</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="identifier" onChange={handleChange} placeholder="Identifikátor" required className="w-full border px-3 py-2 rounded" />
        <input name="floor" type="number" onChange={handleChange} placeholder="Podlaží" className="w-full border px-3 py-2 rounded" />
        <input name="disposition" onChange={handleChange} placeholder="Dispozice" className="w-full border px-3 py-2 rounded" />
        <input name="area" type="number" step="0.01" onChange={handleChange} placeholder="Plocha (m²)" className="w-full border px-3 py-2 rounded" />
        <input name="monthly_rent" type="number" step="0.01" onChange={handleChange} placeholder="Měsíční nájem" className="w-full border px-3 py-2 rounded" />
        <input name="deposit" type="number" step="0.01" onChange={handleChange} placeholder="Kauce" className="w-full border px-3 py-2 rounded" />
        <input name="property_id" onChange={handleChange} placeholder="ID nemovitosti" required className="w-full border px-3 py-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Uložit</button>
      </form>
    </div>
  )
}
