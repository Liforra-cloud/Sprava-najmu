//najem-app/components/LeaseForm.tsx

'use client'

import { useEffect, useState } from 'react'
import TenantPaymentHistory from './TenantPaymentHistory'

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
type Tenant = { id: string; name: string }
type FieldState = { value: string; billable: boolean }

export default function LeaseForm({ existingLease, onSaved }: LeaseFormProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])

  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [unitId, setUnitId] = useState(existingLease?.unit_id || '')
  const [tenantId, setTenantId] = useState(existingLease?.tenant_id || '')
  const [name, setName] = useState(existingLease?.name || '')
  const [startDate, setStartDate] = useState(existingLease?.start_date.slice(0, 10) || '')
  const [endDate, setEndDate] = useState(existingLease?.end_date?.slice(0, 10) || '')

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

  const filteredUnits = selectedPropertyId
    ? units.filter(unit => unit.property_id === selectedPropertyId)
    : units

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

    if (!tenantId || !unitId || !startDate) {
      setError('Chybí požadovaná pole (nájemník, jednotka nebo začátek nájmu)')
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
      rent_amount: Number(rentAmount.value || 0),
      monthly_water: Number(monthlyWater.value || 0),
      monthly_gas: Number(monthlyGas.value || 0),
      monthly_electricity: Number(monthlyElectricity.value || 0),
      monthly_services: Number(monthlyServices.value || 0),
      repair_fund: Number(monthlyFund.value || 0),
      charge_flags,
      custom_charges: customFields.map(f => ({
        name: f.label,
        amount: Number(f.value || 0),
        enabled: f.billable
      })),
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
      onSaved?.() // ✅ spustí refetch dat z EditLeasePage
    } else {
      const err = await res.json()
      setError(err.error || 'Chyba při odesílání')
      console.error(err)
    }
  }

  if (success) return <p className="text-green-600">Smlouva byla úspěšně {existingLease ? 'aktualizována' : 'přidána'}.</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 font-bold">{error}</p>}

      <label className="block">Nájemník:
        <select value={tenantId} onChange={e => setTenantId(e.target.value)} className="w-full border p-2 rounded">
          <option value="">-- Vyber nájemníka --</option>
          {tenants.map(tenant => (
            <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
          ))}
        </select>
      </label>

      <label className="block">Název smlouvy:
        <input value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">Nemovitost:
        <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} className="w-full border p-2 rounded">
          <option value="">-- Vyber nemovitost --</option>
          {properties.map(property => (
            <option key={property.id} value={property.id}>{property.name}</option>
          ))}
        </select>
      </label>

      <label className="block">Jednotka:
        <select value={unitId} onChange={e => setUnitId(e.target.value)} className="w-full border p-2 rounded">
          <option value="">-- Vyber jednotku --</option>
          {filteredUnits.map(unit => (
            <option key={unit.id} value={unit.id}>{unit.identifier}</option>
          ))}
        </select>
      </label>

      <label className="block">Začátek nájmu:
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">Konec nájmu:
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      {renderField("Měsíční nájem", rentAmount, setRentAmount)}
      {renderField("Záloha voda", monthlyWater, setMonthlyWater)}
      {renderField("Záloha plyn", monthlyGas, setMonthlyGas)}
      {renderField("Záloha elektřina", monthlyElectricity, setMonthlyElectricity)}
      {renderField("Záloha služby", monthlyServices, setMonthlyServices)}
      {renderField("Záloha na fond oprav", monthlyFund, setMonthlyFund)}

      <div className="space-y-2">
        <label className="font-semibold">Vlastní náklady:</label>
        {customFields.map((field, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Název"
              value={field.label}
              onChange={e => handleCustomFieldChange(index, e.target.value, field.value, field.billable)}
              className="w-1/3 border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Částka"
              value={field.value}
              onChange={e => handleCustomFieldChange(index, field.label, e.target.value, field.billable)}
              className="w-1/3 border p-2 rounded"
            />
            <label className="flex items-center gap-1 w-1/3">
              <input
                type="checkbox"
                checked={field.billable}
                onChange={e => handleCustomFieldChange(index, field.label, field.value, e.target.checked)}
              />
              Účtovat
            </label>
          </div>
        ))}
        {customFields.length < 5 && (
          <button type="button" onClick={addCustomField} className="text-blue-600 underline mt-1">
            Přidat další položku
          </button>
        )}
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
        {existingLease ? 'Uložit změny' : 'Uložit smlouvu'}
      </button>

      {existingLease && tenantId && (
        <TenantPaymentHistory tenantId={tenantId} />
      )}
    </form>
  )

  function renderField(
    label: string,
    state: FieldState,
    setState: (val: FieldState) => void
  ) {
    return (
      <div className="flex items-center gap-4">
        <label className="w-1/2">
          {label}:
          <input
            type="number"
            value={state.value}
            onChange={e => setState({ ...state, value: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={state.billable}
            onChange={e => setState({ ...state, billable: e.target.checked })}
          />
          Účtovat
        </label>
      </div>
    )
  }
}
