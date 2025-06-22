// najem-app/app/leases/[id]/edit/page.tsx

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import LeaseForm from '@/components/LeaseForm'
import MonthlyObligationsTable from '@/components/MonthlyObligationsTable'
import { useParams, useRouter } from 'next/navigation'

// Kompatibilní typ s LeaseForm (sjednocený)
type CustomCharge = {
  name: string
  amount: number
  enabled: boolean
}

type LeaseFromAPI = {
  id: string
  unit_id: string
  tenant_id: string
  name?: string
  start_date: string
  end_date?: string | null
  due_day?: number | null
  rent_amount: number
  monthly_water: number
  monthly_gas: number
  monthly_electricity: number
  monthly_services: number
  repair_fund: number
  deposit: number
  charge_flags: Record<string, boolean>
  custom_charges: CustomCharge[]
  document_url?: string | null
  // Ostatní pole pokud by přišly z API, ale LeaseForm je nepotřebuje:
  custom_fields?: any
  total_billable_rent?: number
  created_at?: string
  updated_at?: string
}

export default function EditLeasePage() {
  const params = useParams()
  const router = useRouter()
  const id =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : ''

  const [lease, setLease] = useState<LeaseFromAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [validationError, setValidationError] = useState<string | null>(null)
  const prevDates = useRef<{ start: string; end?: string | null }>({ start: '', end: undefined })

  useEffect(() => {
    if (lease) {
      prevDates.current = { start: lease.start_date, end: lease.end_date }
    }
  }, [lease])

  const fetchLease = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/leases/${id}`)
      if (!res.ok) throw new Error('Chyba při načítání smlouvy')
      const data: LeaseFromAPI = await res.json()
      setLease({
        ...data,
        name: data.name ?? '',
        end_date: data.end_date ?? null,
        due_day: data.due_day ?? null,
        charge_flags: data.charge_flags ?? {},
        custom_charges: data.custom_charges ?? [],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Neočekávaná chyba'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchLease()
  }, [id, fetchLease])

  const handleDelete = async () => {
    const confirmed = prompt('Pro smazání smlouvy napište: Smazat smlouvu')
    if (confirmed !== 'Smazat smlouvu') return

    const res = await fetch(`/api/leases/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/leases')
    } else {
      const error = await res.json()
      alert(error.message || 'Nepodařilo se smazat smlouvu')
    }
  }

  // Ukládání smlouvy (volá LeaseForm)
  // Typ odpovídá LeaseFormu: (updatedLease?: LeaseFromAPI) => void | Promise<void>
  const handleLeaseSave = async (updatedLease?: LeaseFromAPI) => {
    if (!updatedLease) return

    setLease(updatedLease)

    // VALIDACE: zkontroluj povinná pole
    if (!updatedLease.start_date || !updatedLease.unit_id || !updatedLease.tenant_id) {
      setValidationError('Vyplňte prosím všechna povinná pole (datum od, jednotku, nájemníka).')
      setSaveState('error')
      return
    }

    setValidationError(null)

    // KONTROLA změny období
    const prevStart = prevDates.current.start
    const prevEnd = prevDates.current.end
    const isPeriodChanged = prevStart !== updatedLease.start_date || prevEnd !== updatedLease.end_date

    let confirmed = true
    if (isPeriodChanged) {
      confirmed = window.confirm(
        'Změnil/a jste období smlouvy.\n\nPokračováním dojde k aktualizaci všech měsíců v měsíčních povinnostech (přidání/smazání měsíců dle nového období). Opravdu chcete pokračovat?'
      )
      if (!confirmed) return
    }

    setSaveState('saving')

    // Uložíme smlouvu (PUT)
    const res = await fetch(`/api/leases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedLease)
    })

    if (!res.ok) {
      const errText = await res.text()
      setSaveState('error')
      setValidationError('Chyba při ukládání smlouvy: ' + errText)
      return
    }

    // Pokud je změna období, aktualizuj monthly obligations na serveru
    if (isPeriodChanged) {
      const periodRes = await fetch(`/api/leases/${id}/update-months`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: updatedLease.start_date,
          end_date: updatedLease.end_date
        })
      })
      if (!periodRes.ok) {
        setSaveState('error')
        setValidationError('Smlouva byla uložena, ale nepodařilo se aktualizovat měsíční povinnosti!')
        return
      }
    }

    setSaveState('saved')
    setTimeout(() => {
      setSaveState('idle')
      fetchLease()
    }, 1000)
  }

  if (loading && !lease) return <p>Ukládám smlouvu…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!lease) return <p>Smlouva nenalezena.</p>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Informace o smlouvě</h1>
      {validationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {validationError}
        </div>
      )}
      {saveState === 'saving' && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded mb-4">
          Ukládám smlouvu…
        </div>
      )}
      {saveState === 'saved' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
          Smlouva byla uložena.
        </div>
      )}

      {/* LeaseForm musí volat handleLeaseSave při submitu */}
      <LeaseForm existingLease={lease} onSaved={handleLeaseSave} />

      <div>
        <h2 className="text-lg font-bold mb-2">Měsíční povinnosti</h2>
        <MonthlyObligationsTable leaseId={lease.id} />
      </div>

      <div className="text-right mt-8">
        <button
          onClick={handleDelete}
          className="text-red-600 underline hover:text-red-800 transition"
        >
          Smazat smlouvu
        </button>
      </div>
    </div>
  )
}
