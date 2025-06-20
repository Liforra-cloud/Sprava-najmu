'use client'

import { useEffect, useState } from 'react'
import DocumentUpload from './DocumentUpload'    // váš upload-komponent

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
  document_url?: string | null
}

type LeaseFormProps = {
  existingLease?: LeaseFromAPI
  onSaved?: () => void
}

type Property = { id: string; name: string }
type Unit = { id: string; identifier: string; property_id: string }
type Tenant = { id: string; full_name: string }
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
  const [dueDay, setDueDay] = useState(existingLease?.due_day?.toString() || '')

  const [rentAmount, setRentAmount] = useState<FieldState>({
    value: existingLease?.rent_amount.toString() || '',
    billable: existingLease?.charge_flags.rent_amount ?? true,
  })
  const [monthlyWater, setMonthlyWater] = useState<FieldState>({
    value: existingLease?.monthly_water.toString() || '',
    billable: existingLease?.charge_flags.monthly_water ?? true,
  })
  const [monthlyGas, setMonthlyGas] = useState<FieldState>({
    value: existingLease?.monthly_gas.toString() || '',
    billable: existingLease?.charge_flags.monthly_gas ?? true,
  })
  const [monthlyElectricity, setMonthlyElectricity] = useState<FieldState>({
    value: existingLease?.monthly_electricity.toString() || '',
    billable: existingLease?.charge_flags.monthly_electricity ?? true,
  })
  const [monthlyServices, setMonthlyServices] = useState<FieldState>({
    value: existingLease?.monthly_services.toString() || '',
    billable: existingLease?.charge_flags.monthly_services ?? true,
  })
  const [monthlyFund, setMonthlyFund] = useState<FieldState>({
    value: existingLease?.repair_fund.toString() || '',
    billable: existingLease?.charge_flags.repair_fund ?? false,
  })

  const [customFields, setCustomFields] = useState(
    existingLease?.custom_charges.map(c => ({
      label: c.name,
      value: c.amount.toString(),
      billable: c.enabled,
    })) || [{ label: '', value: '', billable: true }]
  )

  // Nově: URL nahraného dokumentu
  const [documentUrl, setDocumentUrl] = useState<string>(existingLease?.document_url || '')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    async function load() {
      const [uRes, pRes, tRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/properties'),
        fetch('/api/tenants'),
      ])
      const [u, p, t] = await Promise.all([uRes.json(), pRes.json(), tRes.json()])
      setUnits(u)
      setProperties(p)
      setTenants(t)

      if (existingLease) {
        const unit = u.find((x: Unit) => x.id === existingLease.unit_id)
        if (unit) setSelectedPropertyId(unit.property_id)
      }
    }
    load()
  }, [existingLease])

  const filteredUnits = selectedPropertyId
    ? units.filter(u => u.property_id === selectedPropertyId)
    : units

  const payload = {
    name,
    unit_id: unitId,
    tenant_id: tenantId,
    start_date: new Date(startDate),
    end_date: endDate ? new Date(endDate) : null,
    due_day: dueDay === '' ? null : Number(dueDay),
    rent_amount: Number(rentAmount.value),
    monthly_water: Number(monthlyWater.value),
    monthly_gas: Number(monthlyGas.value),
    monthly_electricity: Number(monthlyElectricity.value),
    monthly_services: Number(monthlyServices.value),
    repair_fund: Number(monthlyFund.value),
    charge_flags: {
      rent_amount: rentAmount.billable,
      monthly_water: monthlyWater.billable,
      monthly_gas: monthlyGas.billable,
      monthly_electricity: monthlyElectricity.billable,
      monthly_services: monthlyServices.billable,
      repair_fund: monthlyFund.billable,
    },
    custom_charges: customFields.map(f => ({
      name: f.label,
      amount: Number(f.value),
      enabled: f.billable,
    })),
    document_url: documentUrl,  // <--- přidáno
  }

  async function saveLease(): Promise<boolean> {
    if (!tenantId || !unitId || !startDate) {
      setError('Chybí povinná pole')
      return false
    }
    setError('')
    const method = existingLease ? 'PUT' : 'POST'
    const url = existingLease ? `/api/leases/${existingLease.id}` : '/api/leases'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setSuccess(true)
      onSaved?.()
      return true
    } else {
      const data = await res.json()
      setError(data.error || 'Chyba při ukládání')
      return false
    }
  }

  async function updateObligations(mode: 'all' | 'future') {
    if (!existingLease) return
    await fetch(`/api/leases/${existingLease.id}/update-obligations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
  }

  async function handleSaveAndUpdate(mode: 'future' | 'all') {
    setIsProcessing(true)
    const ok = await saveLease()
    if (ok) {
      await updateObligations(mode)
      window.location.reload()
    } else {
      setIsProcessing(false)
    }
  }

  return (
    <form className="space-y-6">
      {error && <p className="text-red-600 font-bold">{error}</p>}
      {success && <p className="text-green-600 font-bold">Smlouva uložena.</p>}

      {/* … ostatní fieldsety … */}

      {/* Sekce pro dokument */}
      <fieldset className="border p-4 rounded">
        <legend className="text-lg font-bold mb-2">Přiložený dokument</legend>
        <DocumentUpload
          value={documentUrl}
          onChange={url => setDocumentUrl(url)}
        />
      </fieldset>

      {/* Akční tlačítka */}
      {existingLease ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isProcessing}
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => handleSaveAndUpdate('future')}
          >
            {isProcessing ? '⏳ Zpracovávám…' : 'Uložit a aktualizovat budoucí závazky'}
          </button>
          <button
            type="button"
            disabled={isProcessing}
            className="bg-green-800 text-white px-4 py-2 rounded"
            onClick={() => handleSaveAndUpdate('all')}
          >
            {isProcessing ? '⏳ Zpracovávám…' : 'Uložit a aktualizovat všechny závazky'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isProcessing}
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => handleSaveAndUpdate('all')}
        >
          {isProcessing ? '⏳ Zpracovávám…' : 'Uložit'}
        </button>
      )}
    </form>
  )

  function renderField(label: string, state: FieldState, setter: (v: FieldState) => void) {
    return (
      <label className="flex flex-col">
        {label}:
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={state.value}
            onChange={e => setter({ ...state, value: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={state.billable}
              onChange={e => setter({ ...state, billable: e.target.checked })}
            />
            Účtovat
          </label>
        </div>
      </label>
    )
  }
}
