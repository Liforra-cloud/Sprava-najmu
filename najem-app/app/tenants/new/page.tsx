//app/tenants/new/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TenantForm = {
  full_name: string
  email: string
  phone: string
  personal_id: string
  address: string
  employer: string
  note: string
}

export default function NewTenantPage() {
  const router = useRouter()
  const [form, setForm] = useState<TenantForm>({
    full_name: '',
    email: '',
    phone: '',
    personal_id: '',
    address: '',
    employer: '',
    note: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push('/tenants')
    } else {
      const data = await res.json()
      alert(data.error || 'Chyba při ukládání')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Přidat nájemníka</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Jméno a příjmení</label>
          <input
            name="full_name"
            type="text"
            required
            value={form.full_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Telefon</label>
          <input
            name="phone"
            type="text"
            value={form.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Rodné číslo</label>
          <input
            name="personal_id"
            type="text"
            value={form.personal_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Adresa</label>
          <input
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Zaměstnavatel</label>
          <input
            name="employer"
            type="text"
            value={form.employer}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Poznámka</label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
            rows={2}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {isSubmitting ? 'Ukládám...' : 'Přidat nájemníka'}
        </button>
      </form>
    </div>
  )
}
