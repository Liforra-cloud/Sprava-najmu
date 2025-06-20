// components/LeaseForm.tsx

'use client'

import React, { useEffect, useState, useRef } from 'react'
import DocumentUpload from './DocumentUpload'

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
  initialTenantId?: string
  onSaved?: () => void
}

type Property = { id: string; name: string }
type Unit = { id: string; identifier: string; property_id: string }
type Tenant = { id: string; full_name: string }
type FieldState = { value: string; billable: boolean }

export default function LeaseForm({
  existingLease,
  initialTenantId,
  onSaved,
}: LeaseFormProps) {
  // data pro selecty
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits]           = useState<Unit[]>([])
  const [tenants, setTenants]       = useState<Tenant[]>([])

  // formulářové stavy
  const [tenantId, setTenantId]           = useState(existingLease?.tenant_id || initialTenantId || '')
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [unitId, setUnitId]               = useState(existingLease?.unit_id || '')
  const [name, setName]                   = useState(existingLease?.name || '')
  const [startDate, setStartDate]         = useState(existingLease?.start_date.slice(0, 10) || '')
  const [endDate, setEndDate]             = useState(existingLease?.end_date?.slice(0, 10) || '')
  const [dueDay, setDueDay]               = useState(existingLease?.due_day?.toString() || '')

  const [rentAmount, setRentAmount]       = useState<FieldState>({ value: existingLease?.rent_amount.toString() || '', billable: existingLease?.charge_flags.rent_amount ?? true })
  const [monthlyWater, setMonthlyWater]   = useState<FieldState>({ value: existingLease?.monthly_water.toString() || '', billable: existingLease?.charge_flags.monthly_water ?? true })
  const [monthlyGas, setMonthlyGas]       = useState<FieldState>({ value: existingLease?.monthly_gas.toString() || '', billable: existingLease?.charge_flags.monthly_gas ?? true })
  const [monthlyElectricity, setMonthlyElectricity] = useState<FieldState>({ value: existingLease?.monthly_electricity.toString() || '', billable: existingLease?.charge_flags.monthly_electricity ?? true })
  const [monthlyServices, setMonthlyServices]       = useState<FieldState>({ value: existingLease?.monthly_services.toString() || '', billable: existingLease?.charge_flags.monthly_services ?? true })
  const [monthlyFund, setMonthlyFund]     = useState<FieldState>({ value: existingLease?.repair_fund.toString() || '', billable: existingLease?.charge_flags.repair_fund ?? false })

  const [customFields, setCustomFields]   = useState(
    existingLease?.custom_charges.map(c => ({ label: c.name, value: c.amount.toString(), billable: c.enabled })) ||
    [{ label: '', value: '', billable: true }]
  )

  const [documentUrl, setDocumentUrl]     = useState<string>(existingLease?.document_url || '')

  // UI statusy
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState(false)
  const [isProcessing, setIsProcessing]   = useState(false)
  const [fieldErrors, setFieldErrors]     = useState<Record<string, boolean>>({})
  const errorRef = useRef<HTMLDivElement>(null)

  // automatické skrytí hlášky
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 3000)
      return () => clearTimeout(t)
    }
  }, [error])

  // scroll ke hlášce, pokud je mimo viewport
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [error])

  // načtení dat pro selecty
  useEffect(() => {
    async function load() {
      const [uRes, pRes, tRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/properties'),
        fetch('/api/tenants'),
      ])
      setUnits(await uRes.json())
      setProperties(await pRes.json())
      setTenants(await tRes.json())
      if (existingLease) {
        const unit = (await uRes.json() as Unit[]).find(u => u.id === existingLease.unit_id)
        if (unit) setSelectedPropertyId(unit.property_id)
      }
    }
    load()
  }, [existingLease])

  const filteredUnits = selectedPropertyId
    ? units.filter(u => u.property_id === selectedPropertyId)
    : units

  // validace povinných polí
  function validate(): boolean {
    const errs: Record<string, boolean> = {}
    if (!tenantId) errs.tenantId = true
    if (!unitId)   errs.unitId = true
    if (!startDate) errs.startDate = true
    setFieldErrors(errs)
    if (Object.keys(errs).length) {
      setError('Vyplňte všechna povinná pole.')
      return false
    }
    return true
  }

  // uložit data
  async function saveLease(): Promise<boolean> {
    if (!validate()) return false

    setError('')
    const method = existingLease ? 'PUT' : 'POST'
    const url = existingLease ? `/api/leases/${existingLease.id}` : '/api/leases'
    const payload = {
      name, unit_id: unitId, tenant_id: tenantId,
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
      document_url: documentUrl,
    }
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setSuccess(true)
      onSaved?.()
      return true
    } else {
      const data = await res.json()
      setError(data.error || 'Chyba při ukládání.')
      return false
    }
  }

  async function updateObligations(mode: 'future' | 'all') {
    if (!existingLease) return
    await fetch(`/api/leases/${existingLease.id}/update-obligations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
  }

  async function handleSaveAndUpdate(mode: 'future' | 'all') {
    setIsProcessing(true)
    if (await saveLease()) {
      await updateObligations(mode)
      window.location.reload()
    } else {
      setIsProcessing(false)
    }
  }

  return (
    <form className="space-y-6">
      {/* zpráva o chybě / úspěchu */}
      <div ref={errorRef} className="sticky top-16 z-20">
        {error && (
          <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </p>
        )}
        {success && (
          <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4">
            Smlouva uložena.
          </p>
        )}
      </div>

      {/* základní informace */}
      <fieldset className="border p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
        <legend className="text-lg font-bold mb-2 col-span-full">
          Základní informace
        </legend>
        <label className="flex flex-col">
          Nájemník*:
          <select
            value={tenantId}
            onChange={e => setTenantId(e.target.value)}
            className={`w-full border p-2 rounded ${fieldErrors.tenantId ? 'border-red-500' : ''}`}
          >
            <option value="">-- Vyber nájemníka --</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          Název smlouvy:
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </label>
        <label className="flex flex-col">
          Nemovitost:
          <select
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Vyber nemovitost --</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          Jednotka*:
          <select
            value={unitId}
            onChange={e => setUnitId(e.target.value)}
            className={`w-full border p-2 rounded ${fieldErrors.unitId ? 'border-red-500' : ''}`}
          >
            <option value="">-- Vyber jednotku --</option>
            {filteredUnits.map(u => (
              <option key={u.id} value={u.id}>{u.identifier}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          Začátek nájmu*:
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className={`w-full border p-2 rounded ${fieldErrors.startDate ? 'border-red-500' : ''}`}
          />
        </label>
        <label className="flex flex-col">
          Konec nájmu:
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </label>
        <label className="flex flex-col">
          Den splatnosti:
          <input
            type="number"
            min="1" max="31"
            value={dueDay}
            onChange={e => setDueDay(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </label>
      </fieldset>

      {/* zálohy a náklady */}
      {/* … (ostatní části formuláře beze změny) … */}

      {/* akční tlačítka */}
      {existingLease ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isProcessing}
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => handleSaveAndUpdate('future')}
          >
            {isProcessing ? '⏳ Zpracovávám…' : 'Uložit & aktualizovat budoucí'}
          </button>
          <button
            type="button"
            disabled={isProcessing}
            className="bg-green-800 text-white px-4 py-2 rounded"
            onClick={() => handleSaveAndUpdate('all')}
          >
            {isProcessing ? '⏳ Zpracovávám…' : 'Uložit & aktualizovat vše'}
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
}
