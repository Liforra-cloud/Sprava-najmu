//najem-app/components/LeaseForm.tsx

'use client'

import { useEffect, useState } from 'react'

type LeaseFormProps = {
  tenantId: string
}

type Property = {
  id: string
  name: string
}

type Unit = {
  id: string
  identifier: string
  property_id: string
}

type FieldState = {
  value: string
  billable: boolean
}

export default function LeaseForm({ tenantId }: LeaseFormProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [name, setName] = useState('') // Název smlouvy
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [success, setSuccess] = useState(false)

  const [rentAmount, setRentAmount] = useState<FieldState>({ value: '', billable: true })
  const [monthlyWater, setMonthlyWater] = useState<FieldState>({ value: '', billable: true })
  const [monthlyGas, setMonthlyGas] = useState<FieldState>({ value: '', billable: true })
  const [monthlyElectricity, setMonthlyElectricity] = useState<FieldState>({ value: '', billable: true })
  const [monthlyServices, setMonthlyServices] = useState<FieldState>({ value: '', billable: true })
  const [monthlyFund, setMonthlyFund] = useState<FieldState>({ value: '', billable: false })

  const [customFields, setCustomFields] = useState<{ key: string; value: string; billable: boolean }[]>([
    { key: '', value: '', billable: true }
  ])

  useEffect(() => {
    const fetchAll = async () => {
      const [unitsRes, propsRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/properties')
      ])
      const unitsData = await unitsRes.json()
      const propsData = await propsRes.json()
      setUnits(unitsData || [])
      setProperties(propsData || [])
    }
    fetchAll()
  }, [])

  const filteredUnits = selectedPropertyId
    ? units.filter(unit => unit.property_id === selectedPropertyId)
    : units

  const handleCustomFieldChange = (index: number, key: string, value: string, billable: boolean) => {
    const updated = [...customFields]
    updated[index] = { key, value, billable }
    setCustomFields(updated)
  }

  const addCustomField = () => {
    if (customFields.length < 5) {
      setCustomFields([...customFields, { key: '', value: '', billable: true }])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/leases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        unitId,
        name,
        startDate,
        endDate,
        rentAmount: Number(rentAmount.value),
        monthlyWater: Number(monthlyWater.value),
        monthlyGas: Number(monthlyGas.value),
        monthlyElectricity: Number(monthlyElectricity.value),
        monthlyServices: Number(monthlyServices.value),
        repairFund: Number(monthlyFund.value),
        customFields: customFields.map(f => ({
          ...f,
          value: Number(f.value)
        }))
      }),
    })

    if (res.ok) {
      setSuccess(true)
    } else {
      console.error(await res.json())
    }
  }

  if (success) return <p className="text-green-600">Smlouva byla úspěšně přidána.</p>

  const renderField = (
    label: string,
    state: FieldState,
    setState: (val: FieldState) => void
  ) => (
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
              value={field.key}
              onChange={e => handleCustomFieldChange(index, e.target.value, field.value, field.billable)}
              className="w-1/3 border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Částka"
              value={field.value}
              onChange={e => handleCustomFieldChange(index, field.key, e.target.value, field.billable)}
              className="w-1/3 border p-2 rounded"
            />
            <label className="flex items-center gap-1 w-1/3">
              <input
                type="checkbox"
                checked={field.billable}
                onChange={e => handleCustomFieldChange(index, field.key, field.value, e.target.checked)}
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

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Uložit smlouvu</button>
    </form>
  )
}

