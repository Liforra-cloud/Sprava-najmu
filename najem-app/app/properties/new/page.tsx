'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NewPropertyPage() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase.from('properties').insert([
      {
        name,
        address,
        description: description || null
      }
    ])

    if (error) {
      console.error('Chyba při ukládání nemovitosti:', error)
      alert('Nepodařilo se přidat nemovitost.')
    } else {
      router.push('/properties')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Přidat nemovitost s jednotkou</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Název nemovitosti</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="např. Dům u parku"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Adresa</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="např. Hlavní 123, Praha"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Popis (volitelné)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="např. Krásná vila se zahradou"
            className="w-full border p-2 rounded resize-none"
            rows={4}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Ukládám...' : 'Uložit nemovitost'}
        </button>
      </form>
    </div>
  )
}
