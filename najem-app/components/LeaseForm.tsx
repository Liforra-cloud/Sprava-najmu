// components/LeaseForm.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  due_day?: number | null
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

type Property = { id: string; name: string }
type Unit = { id: string; identifier: string; property_id: string }
type Tenant = { id: string; full_name: string }
type FieldState = { value: string; billable: boolean }

export default function LeaseForm({ existingLease, onSaved }: LeaseFormProps) {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])

  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [unitId, setUnitId] = useState(existingLease?.unit_id || '')
  const [tenantId, setTenantId] = useState(existingLease?.tenant_id || '')
  const [name, setName] = useState(existingLease?.name || '')
  const [startDate, setStartDate] = useState(existingLease?.start_date?.slice(0, 10) || '')
  const [endDate, setEndDate] = useState(existingLease?.end_date?.slice(0, 10) || '')
  const [dueDay, setDueDay] = useState(existingLease?.due_day?.toString() || '1')

  const [rentAmount, setRentAmount] = useState<FieldState>({ value: existingLease?.rent_amount?.toString() || '', billable: existingLease?.charge_flags?.rent_amount ?? true })
  const [monthlyWater, setMonthlyWater] = useState<FieldState>({ value: existingLease?.monthly_water?.toString() || '', billable: existingLease?.charge_flags?.monthly_water ?? true })
  const [monthlyGas, setMonthlyGas] = useState<FieldState>({ value: existingLease?.monthly_gas?.toString() || '', billable: existingLease?.charge_flags?.monthly_gas ?? true })
  const [monthlyElectricity, setMonthlyElectricity] = useState<FieldState>({ value: existingLease?.monthly_electricity?.toString() || '', billable: existingLease?.charge_flags?.monthly_electricity ?? true })
  const [monthlyServices, setMonthlyServices] = useState<FieldState>({ value: existingLease?.monthly_services?.toString() || '', billable: existingLease?.charge_flags?.monthly_services ?? true })
  const [monthlyFund, setMonthlyFund] = useState<FieldState>({ value: existingLease?.repair_fund?.toString() || '', billable: existingLease?.charge_flags?.repair_fund ?? false })

  const [customFields, setCustomFields] = useState<{ label: string; value: string; billable: boolean }[]>(
    existingLease?.custom_charges?.map(c => ({ label: c.name, value: c.amount.toString(), billable: c.enabled })) || [{ label: '', value: '', billable: true }]
  )

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      const [unitsRes, propsRes, tenantsRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/properties'),
        fetch('/api/tenants')
      ])
      const fetchedUnits = await unitsRes.json()
      setUnits(fetchedUnits)
      setProperties(await propsRes.json())
      setTenants(await tenantsRes.json())

      if (existingLease) {
        const unit = fetchedUnits.find((u: Unit) => u.id === existingLease.unit_id)
        if (unit) setSelectedPropertyId(unit.property_id)
      }
    }
    fetchAll()
  }, [existingLease])

  const filteredUnits = selectedPropertyId ? units.filter(unit => unit.property_id === selectedPropertyId) : units

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tenantId || !unitId || !startDate) {
      setError('Chybí požadovaná pole')
      return
    }

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
      unit_id: unitId,
      tenant_id: tenantId,
      start_date: new Date(startDate),
      end_date: endDate ? new Date(endDate) : null,
      due_day: parseInt(dueDay),
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

  const handleDelete = async () => {
    const confirmText = prompt('Pro potvrzení napiš: Smazat smlouvu')
    if (confirmText !== 'Smazat smlouvu') return

    const res = await fetch(`/api/leases/${existingLease?.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/leases')
    } else {
      const data = await res.json()
      alert(data.error || 'Chyba při mazání smlouvy')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-600 font-bold">{error}</p>}
      {success && <p className="text-green-600 font-bold">Smlouva uložena.</p>}

      {/* Základní informace */}
      <fieldset className="border p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
        <legend className="text-lg font-bold mb-2 col-span-full">Základní informace</legend>

        <label>Nájemník:
          <select value={tenantId} onChange={e => setTenantId(e.target.value)} className="w-full border p-2 rounded">
            <option value="">-- Vyber nájemníka --</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </label>

        <label>Název smlouvy:
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
        </label>

        <label>Nemovitost:
          <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} className="w-full border p-2 rounded">
            <option value="">-- Vyber nemovitost --</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        <label>Jednotka:
          <select value={unitId} onChange={e => setUnitId(e.target.value)} className="w-full border p-2 rounded">
            <option value="">-- Vyber jednotku --</option>
            {filteredUnits.map(u => <option key={u.id} value={u.id}>{u.identifier}</option>)}
          </select>
        </label>

        <label>Začátek nájmu:
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-2 rounded" />
        </label>

        <label>Konec nájmu:
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border p-2 rounded" />
        </label>

        <label>Den splatnosti (1–31):
          <input type="number" min={1} max={31} value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full border p-2 rounded" />
        </label>
      </fieldset>

      {/* Zálohy a náklady */}
      <fieldset className="border p-4 rounded">
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

      {/* Vlastní poplatky */}
      <fieldset className="border p-4 rounded">
        <legend className="text-lg font-bold mb-2">Vlastní poplatky</legend>
        {customFields.map((field, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input type="text" value={field.label} onChange={e => {
              const newFields = [...customFields]
              newFields[i].label = e.target.value
              setCustomFields(newFields)
            }} placeholder="Název" className="border p-2 rounded" />
            <input type="number" value={field.value} onChange={e => {
              const newFields = [...customFields]
              newFields[i].value = e.target.value
              setCustomFields(newFields)
            }} placeholder="Částka" className="border p-2 rounded" />
            <label className="flex gap-2 items-center">
              <input type="checkbox" checked={field.billable} onChange={e => {
                const newFields = [...customFields]
                newFields[i].billable = e.target.checked
                setCustomFields(newFields)
              }} />
              Účtovat
            </label>
          </div>
        ))}
        {customFields.length < 5 && (
          <button type="button" onClick={() => setCustomFields([...customFields, { label: '', value: '', billable: true }])} className="text-blue-600 mt-2 underline">Přidat další položku</button>
        )}
      </fieldset>

      {/* Ovládací tlačítka */}
      <div className="flex justify-between items-center pt-4">
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Uložit</button>
        {existingLease && (
          <button type="button" onClick={handleDelete} className="text-red-600 underline">Smazat smlouvu</button>
        )}
      </div>
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
