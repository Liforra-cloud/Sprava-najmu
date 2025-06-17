// components/LeaseForm.tsx

'use client'

import { useState } from 'react'

type LeaseFormProps = {
  existingLease?: LeaseFromAPI
  onSaved?: () => void
}

type LeaseFromAPI = {
  id: string
  unit_id: string
  tenant_id: string
  name?: string
  start_date: string
  end_date?: string | null
  due_date?: string | null
  rent_amount: number
  monthly_water: number
  monthly_gas: number
  monthly_electricity: number
  monthly_services: number
  repair_fund: number
  charge_flags: Record<string, boolean>
  custom_charges: {
    name: string
    amount: number
    enabled: boolean
  }[]
}

type FieldState = { value: string; billable: boolean }

export default function LeaseForm({ existingLease, onSaved }: LeaseFormProps) {
  const [startDate, setStartDate] = useState(existingLease?.start_date.slice(0, 10) || '')
  const [endDate, setEndDate] = useState(existingLease?.end_date?.slice(0, 10) || '')
  const [dueDate, setDueDate] = useState(existingLease?.due_date?.slice(0, 10) || '')
  const [name, setName] = useState(existingLease?.name || '')

  const [rentAmount, setRentAmount] = useState<FieldState>({
    value: existingLease?.rent_amount?.toString() || '',
    billable: existingLease?.charge_flags?.rent_amount ?? true
  })
  const [monthlyWater, setMonthlyWater] = useState<FieldState>({
    value: existingLease?.monthly_water?.toString() || '',
    billable: existingLease?.charge_flags?.monthly_water ?? true
  })
  const [monthlyGas, setMonthlyGas] = useState<FieldState>({
    value: existingLease?.monthly_gas?.toString() || '',
    billable: existingLease?.charge_flags?.monthly_gas ?? true
  })
  const [monthlyElectricity, setMonthlyElectricity] = useState<FieldState>({
    value: existingLease?.monthly_electricity?.toString() || '',
    billable: existingLease?.charge_flags?.monthly_electricity ?? true
  })
  const [monthlyServices, setMonthlyServices] = useState<FieldState>({
    value: existingLease?.monthly_services?.toString() || '',
    billable: existingLease?.charge_flags?.monthly_services ?? true
  })
  const [monthlyFund, setMonthlyFund] = useState<FieldState>({
    value: existingLease?.repair_fund?.toString() || '',
    billable: existingLease?.charge_flags?.repair_fund ?? false
  })

  const [customFields, setCustomFields] = useState<{ label: string; value: string; billable: boolean }[]>(
    existingLease?.custom_charges?.map(c => ({
      label: c.name,
      value: c.amount.toString(),
      billable: c.enabled
    })) || [{ label: '', value: '', billable: true }]
  )

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleCustomFieldChange = (index: number, label: string, value: string, billable: boolean) => {
    const updated = [...customFields]
    updated[index] = { label, value, billable }
    setCustomFields(updated)
  }

  const addCustomField = () => {
    if (customFields.length < 5) {
      setCustomFields([...customFields, { label: '', value: '', billable: true }])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const charge_flags = {
      rent_amount: rentAmount.billable,
      monthly_water: monthlyWater.billable,
      monthly_gas: monthlyGas.billable,
      monthly_electricity: monthlyElectricity.billable,
      monthly_services: monthlyServices.billable,
      repair_fund: monthlyFund.billable,
    }

    const payload = {
      name,
      unit_id: existingLease?.unit_id ?? '',
      tenant_id: existingLease?.tenant_id ?? '',
      start_date: new Date(startDate),
      end_date: endDate ? new Date(endDate) : null,
      due_date: dueDate ? new Date(dueDate) : null,
      rent_amount: Number(rentAmount.value || 0),
      monthly_water: Number(monthlyWater.value || 0),
      monthly_gas: Number(monthlyGas.value || 0),
      monthly_electricity: Number(monthlyElectricity.value || 0),
      monthly_services: Number(monthlyServices.value || 0),
      repair_fund: Number(monthlyFund.value || 0),
      charge_flags,
      custom_charges: customFields.map(f => ({ name: f.label, amount: Number(f.value || 0), enabled: f.billable })),
      custom_fields: {},
      total_billable_rent: 0
    }

    const method = existingLease ? 'PUT' : 'POST'
    const url = existingLease ? `/api/leases/${existingLease.id}` : '/api/leases'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      setSuccess(true)
      onSaved?.()
    } else {
      const err = await res.json()
      setError(err.error || 'Chyba při odesílání')
      console.error(err)
    }
  }

  if (success) return <p className="text-green-600">Smlouva byla úspěšně {existingLease ? 'aktualizována' : 'přidána'}.</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <p className="text-red-600 font-bold">{error}</p>}

      <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
        <legend className="text-lg font-bold mb-2">Základní informace</legend>

        <label>Název smlouvy:
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
        </label>

        <label>Začátek nájmu:
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-2 rounded" />
        </label>

        <label>Konec nájmu:
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border p-2 rounded" />
        </label>

        <label>Datum splatnosti:
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border p-2 rounded" />
        </label>
      </fieldset>

      <fieldset className="border p-4 rounded space-y-4">
        <legend className="text-lg font-bold mb-2">Zálohy a náklady</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField("Měsíční nájem", rentAmount, setRentAmount)}
          {renderField("Záloha voda", monthlyWater, setMonthlyWater)}
          {renderField("Záloha plyn", monthlyGas, setMonthlyGas)}
          {renderField("Záloha elektřina", monthlyElectricity, setMonthlyElectricity)}
          {renderField("Záloha služby", monthlyServices, setMonthlyServices)}
          {renderField("Fond oprav", monthlyFund, setMonthlyFund)}
        </div>
      </fieldset>

      <fieldset className="border p-4 rounded space-y-2">
        <legend className="text-lg font-bold mb-2">Vlastní poplatky</legend>
        {customFields.map((field, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input type="text" value={field.label} onChange={e => handleCustomFieldChange(i, e.target.value, field.value, field.billable)} placeholder="Název" className="border p-2 rounded" />
            <input type="number" value={field.value} onChange={e => handleCustomFieldChange(i, field.label, e.target.value, field.billable)} placeholder="Částka" className="border p-2 rounded" />
            <label className="flex gap-2 items-center">
              <input type="checkbox" checked={field.billable} onChange={e => handleCustomFieldChange(i, field.label, field.value, e.target.checked)} />
              Účtovat
            </label>
          </div>
        ))}
        {customFields.length < 5 && (
          <button type="button" onClick={addCustomField} className="text-blue-600 underline mt-1">
            Přidat další položku
          </button>
        )}
      </fieldset>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
        {existingLease ? 'Uložit změny' : 'Uložit smlouvu'}
      </button>
    </form>
  )

  function renderField(label: string, state: FieldState, setState: (val: FieldState) => void) {
    return (
      <label className="flex flex-col">
        {label}:
        <div className="flex gap-2 items-center">
          <input type="number" value={state.value} onChange={e => setState({ ...state, value: e.target.value })} className="border p-2 rounded w-full" />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={state.billable} onChange={e => setState({ ...state, billable: e.target.checked })} />
            Účtovat
          </label>
        </div>
      </label>
    )
  }
}
