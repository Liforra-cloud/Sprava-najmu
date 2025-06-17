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
  const [startDate, setStartDate] = useState(existingLease?.start_date.slice(0, 10) || '')
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
    setError('')

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
    }
  }

  const handleDelete = async () => {
    const confirmedText = prompt('Pro potvrzení napiš přesně: Smazat smlouvu')
    if (confirmedText !== 'Smazat smlouvu') return

    const res = await fetch(`/api/leases/${existingLease?.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/leases')
    } else {
      const err = await res.json()
      alert(err.error || 'Chyba při mazání smlouvy')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-600 font-bold">{error}</p>}
      {success && <p className="text-green-600 font-bold">Smlouva uložena.</p>}

      {/* ostatní části formuláře viz předchozí zpráva */}

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Uložit změny</button>

      {existingLease && (
        <div className="mt-4">
          <button type="button" onClick={handleDelete} className="text-red-600 underline">
            Smazat smlouvu
          </button>
        </div>
      )}
    </form>
  )
}

