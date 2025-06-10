//app/tenants/new/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTenantPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [personalId, setPersonalId] = useState('')
  const [address, setAddress] = useState('')
  const [employer, setEmployer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone,
        personal_id: personalId,
        address,
        employer
      }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/tenants/${data.id}`)
    } else {
      const errorData = await res.json()
      alert(errorData.error || 'Nepodařilo se přidat nájemníka.')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Přidat nájemníka</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Jméno a příjmení
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Telefon
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="personalId" className="block text-sm font-medium text-gray-700">
            Rodné číslo / číslo OP (volitelné)
          </label>
          <input
            id="personalId"
            type="text"
            value={personalId}
            onChange={e => setPersonalId(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Adresa
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="employer" className="block text-sm font-medium text-gray-700">
            Zaměstnavatel
          </label>
          <input
            id="employer"
            type="text"
            value={employer}
            onChange={e => setEmployer(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm"
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
