//components/LeaseForm.tsx

'use client'

import { useEffect, useState } from 'react'

type LeaseFormProps = {
  tenantId: string
}

type Unit = {
  id: string
  identifier: string
  property?: { name: string } // pokud je součástí joinu
}

export default function LeaseForm({ tenantId }: LeaseFormProps) {
  const [propertyFilter, setPropertyFilter] = useState('')
  const [units, setUnits] = useState<Unit[]>([])
  const [unitId, setUnitId] = useState('')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentAmount, setRentAmount] = useState('')
  const [monthlyWater, setMonthlyWater] = useState('')
  const [monthlyGas, setMonthlyGas] = useState('')
  const [monthlyElectricity, setMonthlyElectricity] = useState('')
  const [monthlyServices, setMonthlyServices] = useState('')
  const [customFields, setCustomFields] = useState([{ key: '', value: '' }])
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch('/api/units')
        const data = await res.json()
        if (Array.isArray(data)) {
          setUnits(data)
        } else if (Array.isArray(data.units)) {
          setUnits(data.units)
        } else {
          console.error('Neplatný formát jednotek', data)
          setUnits([])
        }
      } catch (err) {
        console.error('Chyba při načítání jednotek:', err)
        setUnits([])
      }
    }
    fetchUnits()
  }, [])

  const filteredUnits = units.filter(unit =>
    (!propertyFilter || (unit.property?.name?.toLowerCase().includes(propertyFilter.toLowerCase()))) ||
    unit.identifier.toLowerCase().includes(propertyFilter.toLowerCase())
  )

  const handleCustomFieldChange = (index: number, key: string, value: string) => {
    const updated = [...customFields]
    updated[index] = { key, value }
    setCustomFields(updated)
  }

  const addCustomField = () => {
    if (customFields.length < 5) {
      setCustomFields([...customFields, { key: '', value: '' }])
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
        rentAmount: parseFloat(rentAmount),
        monthlyWater: parseFloat(monthlyWater || '0'),
        monthlyGas: parseFloat(monthlyGas || '0'),
        monthlyElectricity: parseFloat(monthlyElectricity || '0'),
        monthlyServices: parseFloat(monthlyServices || '0'),
        customFields
      }),
    })

    if (res.ok) {
      setSuccess(true)
    }
  }

  if (success) return <p className="text-green-600">Smlouva byla úspěšně přidána.</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        Název smlouvy:
        <input value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">
        Hledat nemovitost nebo jednotku:
        <input value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">
        Vyber jednotku:
        <select value={unitId} onChange={e => setUnitId(e.target.value)} className="w-full border p-2 rounded">
          <option value="">-- Vyber jednotku --</option>
          {filteredUnits.map(unit => (
            <option key={unit.id} value={unit.id}>
              {unit.identifier} {unit.property?.name ? `(${unit.property.name})` : ''}
            </option>
          ))}
        </select>
      </label>

      <label className="block">Začátek nájmu:
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">Konec nájmu:
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">Měsíční nájem:
        <input type="number" value={rentAmount} onChange={e => setRentAmount(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">Záloha voda:
        <input type="number" value={monthlyWater} onChange={e => setMonthlyWater(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">Záloha plyn:
        <input type="number" value={monthlyGas} onChange={e => setMonthlyGas(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">Záloha elektřina:
        <input type="number" value={monthlyElectricity} onChange={e => setMonthlyElectricity(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">Záloha služby:
        <input type="number" value={monthlyServices} onChange={e => setMonthlyServices(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      {/* Vlastní nákladové položky */}
      <div className="space-y-2">
        <label className="font-semibold">Vlastní náklady (max 5):</label>
        {customFields.map((field, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              placeholder="Název"
              value={field.key}
              onChange={e => handleCustomFieldChange(index, e.target.value, field.value)}
              className="w-1/2 border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Částka"
              value={field.value}
              onChange={e => handleCustomFieldChange(index, field.key, e.target.value)}
              className="w-1/2 border p-2 rounded"
            />
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
