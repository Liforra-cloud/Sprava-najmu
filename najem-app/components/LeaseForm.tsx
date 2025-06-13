//components/LeaseForm.tsx

'use client'

import { useState, useEffect } from 'react'

type LeaseFormProps = {
  tenantId: string
}

type Unit = {
  id: string
  identifier: string
}

export default function LeaseForm({ tenantId }: LeaseFormProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [unitId, setUnitId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentAmount, setRentAmount] = useState('')
  const [monthlyWater, setMonthlyWater] = useState('')
  const [monthlyGas, setMonthlyGas] = useState('')
  const [monthlyElectricity, setMonthlyElectricity] = useState('')
  const [monthlyServices, setMonthlyServices] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch('/api/units')
        const data = await res.json()
        if (Array.isArray(data.units)) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/leases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        unitId,
        startDate,
        endDate,
        rentAmount: parseFloat(rentAmount),
        monthlyWater: parseFloat(monthlyWater || '0'),
        monthlyGas: parseFloat(monthlyGas || '0'),
        monthlyElectricity: parseFloat(monthlyElectricity || '0'),
        monthlyServices: parseFloat(monthlyServices || '0'),
      }),
    })

    if (res.ok) {
      setSuccess(true)
    } else {
      console.error('Chyba při odesílání formuláře', await res.text())
    }
  }

  if (success) return <p className="text-green-600">Smlouva byla úspěšně přidána.</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        Byt:
        <select
          value={unitId}
          onChange={e => setUnitId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">-- Vyber byt --</option>
          {Array.isArray(units) && units.length > 0 ? (
            units.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.identifier}
              </option>
            ))
          ) : (
            <option disabled>Žádné dostupné byty</option>
          )}
        </select>
      </label>

      <label className="block">
        Začátek nájmu:
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">
        Konec nájmu:
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border p-2 rounded" />
      </label>

      <label className="block">Nájem: <input type="number" value={rentAmount} onChange={e => setRentAmount(e.target.value)} className="w-full border p-2 rounded" /></label>
      <label className="block">Voda: <input type="number" value={monthlyWater} onChange={e => setMonthlyWater(e.target.value)} className="w-full border p-2 rounded" /></label>
      <label className="block">Plyn: <input type="number" value={monthlyGas} onChange={e => setMonthlyGas(e.target.value)} className="w-full border p-2 rounded" /></label>
      <label className="block">Elektřina: <input type="number" value={monthlyElectricity} onChange={e => setMonthlyElectricity(e.target.value)} className="w-full border p-2 rounded" /></label>
      <label className="block">Služby: <input type="number" value={monthlyServices} onChange={e => setMonthlyServices(e.target.value)} className="w-full border p-2 rounded" /></label>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Uložit smlouvu</button>
    </form>
  )
}

