// najem-app/app/leases/new/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Unit = { id: string; identifier: string }
type Tenant = { id: string; name: string }

export default function NewLeasePage() {
  const router = useRouter()
  const [units, setUnits] = useState<Unit[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [form, setForm] = useState({
    unitId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    monthlyWater: '',
    monthlyGas: '',
    monthlyElectricity: '',
    monthlyServices: ''
  })

  useEffect(() => {
    fetch('/api/units')
      .then(res => res.json())
      .then(setUnits)
    fetch('/api/tenants')
      .then(res => res.json())
      .then(setTenants)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/leases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        rentAmount: parseFloat(form.rentAmount),
        monthlyWater: parseFloat(form.monthlyWater),
        monthlyGas: parseFloat(form.monthlyGas),
        monthlyElectricity: parseFloat(form.monthlyElectricity),
        monthlyServices: parseFloat(form.monthlyServices),
      }),
    })
    if (res.ok) {
      const { id } = await res.json()
      router.push(`/leases/${id}`)
    } else {
      alert('Chyba při ukládání smlouvy')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Nová nájemní smlouva</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block font-semibold">Jednotka</label>
          <select name="unitId" onChange={handleChange} value={form.unitId} required className="w-full border p-2 rounded">
            <option value="">Vyber jednotku</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.identifier}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold">Nájemník</label>
          <select name="tenantId" onChange={handleChange} value={form.tenantId} required className="w-full border p-2 rounded">
            <option value="">Vyber nájemníka</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold">Začátek nájmu</label>
          <input type="date" name="startDate" onChange={handleChange} value={form.startDate} required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-semibold">Konec nájmu</label>
          <input type="date" name="endDate" onChange={handleChange} value={form.endDate} className="w-full border p-2 rounded" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Nájem</label>
            <input type="number" step="0.01" name="rentAmount" onChange={handleChange} value={form.rentAmount} required className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block font-semibold">Voda</label>
            <input type="number" step="0.01" name="monthlyWater" onChange={handleChange} value={form.monthlyWater} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block font-semibold">Plyn</label>
            <input type="number" step="0.01" name="monthlyGas" onChange={handleChange} value={form.monthlyGas} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block font-semibold">Elektřina</label>
            <input type="number" step="0.01" name="monthlyElectricity" onChange={handleChange} value={form.monthlyElectricity} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block font-semibold">Služby</label>
            <input type="number" step="0.01" name="monthlyServices" onChange={handleChange} value={form.monthlyServices} className="w-full border p-2 rounded" />
          </div>
        </div>

        <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Vytvořit smlouvu</button>
      </form>
    </div>
  )
}
