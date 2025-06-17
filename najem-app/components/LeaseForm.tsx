//najem-app/components/LeaseForm.tsx

//najem-app/components/LeaseForm.tsx

'use client'

import { useEffect, useState } from 'react'

type LeaseFormProps = {
  existingLease?: LeaseFromAPI
  onSaved?: () => void // <-- přidáno
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
  const [dueDate, setDueDate] = useState(existingLease?.due_date?.slice(0, 10) || '')

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
      if (onSaved) onSaved() // <-- volání onSaved při úspěchu
    } else {
      const err = await res.json()
      setError(err.error || 'Chyba při odesílání')
      console.error(err)
    }
  }

  if (success) return <p className="text-green-600">Smlouva byla úspěšně {existingLease ? 'aktualizována' : 'přidána'}.</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Formulářové sekce zůstávají beze změny... */}
      {/* ... */}
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
