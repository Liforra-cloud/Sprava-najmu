// app/statements/new/page.tsx

// app/statements/new/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import StatementTable from '@/components/StatementTable'

type Property = { id: string; name: string }
type Unit = { id: string; identifier: string; property_id: string }
type Lease = { id: string; name?: string; start_date: string; end_date?: string | null }
type StatementItem = {
  id?: string
  name: string
  totalAdvance: number
  consumption: number | ''
  unit: string
  totalCost: number | ''
  diff: number
  note?: string
}

function NewStatementPageInner() {
  const searchParams = useSearchParams()
  const unitIdFromQuery = searchParams.get('unit_id') ?? ''

  const now = new Date()
  const thisYear = now.getFullYear()
  const [from, setFrom] = useState(`${thisYear}-01`)
  const [to, setTo] = useState(`${thisYear}-12`)

  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [unitId, setUnitId] = useState(unitIdFromQuery)
  const [leases, setLeases] = useState<Lease[]>([])
  const [tableData, setTableData] = useState<StatementItem[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'preview' | 'saved'>('form')
  const [error, setError] = useState<string | null>(null)

  // Načti properties a units
  useEffect(() => {
    async function load() {
      const [pRes, uRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/units')
      ])
      const properties = await pRes.json() as Property[]
      const units = await uRes.json() as Unit[]
      setProperties(properties)
      setUnits(units)
      // Pokud máme unitId z query, nastav propertyId
      if (unitIdFromQuery && units.length > 0) {
        const found = units.find(u => u.id === unitIdFromQuery)
        if (found) setSelectedPropertyId(found.property_id)
      }
    }
    load()
  }, [unitIdFromQuery])

  // Po výběru jednotky načti leases
  useEffect(() => {
    if (!unitId) {
      setLeases([])
      return
    }
    async function fetchLeases() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/leases?unit_id=${unitId}`)
        if (!res.ok) throw new Error('Nepodařilo se načíst smlouvy')
        const leases = await res.json() as Lease[]
        setLeases(leases)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Neznámá chyba')
      }
      setLoading(false)
    }
    fetchLeases()
  }, [unitId])

  // Náhled vyúčtování (volá endpoint na vyčíslení, data pro tabulku)
  async function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    if (!unitId) return setError('Vyberte jednotku')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/units/${unitId}/statement?from=${from}&to=${to}`)
      if (!res.ok) throw new Error('Nepodařilo se načíst data pro vyúčtování')
      const items = await res.json()
      setTableData(items as StatementItem[])
      setStep('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Neznámá chyba')
    }
    setLoading(false)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          from_month: from,
          to_month: to,
          items: tableData,
        }),
      })
      if (!res.ok) throw new Error('Chyba při ukládání vyúčtování')
      setStep('saved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Neznámá chyba')
    }
    setLoading(false)
  }

  // Filtrování jednotek podle nemovitosti
  const filteredUnits = selectedPropertyId
    ? units.filter(u => u.property_id === selectedPropertyId)
    : units

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-8">
      <h1 className="text-2xl font-bold mb-4">Nové vyúčtování</h1>

      {error && <div className="bg-red-100 text-red-700 border px-3 py-2 rounded">{error}</div>}

      {step === 'form' && (
        <form className="space-y-4" onSubmit={handlePreview}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label>
              Nemovitost:
              <select
                className="border rounded p-2 w-full"
                value={selectedPropertyId}
                onChange={e => setSelectedPropertyId(e.target.value)}
              >
                <option value="">-- Vyber nemovitost --</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label>
              Jednotka:
              <select
                className="border rounded p-2 w-full"
                value={unitId}
                onChange={e => setUnitId(e.target.value)}
                disabled={filteredUnits.length === 0}
              >
                <option value="">-- Vyber jednotku --</option>
                {filteredUnits.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.identifier}
                    {unitIdFromQuery && u.id === unitIdFromQuery ? ' (z výběru)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Smlouvy v období:
              <select className="border rounded p-2 w-full" disabled>
                {leases.length === 0
                  ? <option value="">Nejsou aktivní smlouvy</option>
                  : leases.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name || `Smlouva ${l.id}`}: {l.start_date} – {l.end_date || 'neurčito'}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="flex gap-4 mt-4">
            <label>
              Období od:
              <input
                type="month"
                value={from}
                max={to}
                onChange={e => setFrom(e.target.value)}
                className="border rounded px-2 py-1"
              />
            </label>
            <label>
              do:
              <input
                type="month"
                value={to}
                min={from}
                onChange={e => setTo(e.target.value)}
                className="border rounded px-2 py-1"
              />
            </label>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 text-white px-4 py-2 rounded"
            >
              {loading ? 'Načítám...' : 'Náhled vyúčtování'}
            </button>
          </div>
        </form>
      )}

      {step === 'preview' && (
        <>
          <h2 className="text-xl font-bold">Náhled vyúčtování</h2>
          <StatementTable
            unitId={unitId}
            from={from}
            to={to}
            items={tableData}
            // další props dle své implementace
          />
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setStep('form')}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Zpět
            </button>
            <button
              onClick={handleSave}
              className="bg-green-700 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Ukládám...' : 'Uložit vyúčtování'}
            </button>
          </div>
        </>
      )}

      {step === 'saved' && (
        <div className="bg-green-100 text-green-800 px-3 py-2 rounded">
          Vyúčtování bylo uloženo!
          <Link href="/statements" className="underline text-blue-700 ml-2">
            Zpět na seznam
          </Link>
        </div>
      )}
    </div>
  )
}

// Suspense pro SSR build, aby Next.js nehlásil chybu (řeší problém s useSearchParams)
export default function NewStatementPage() {
  return (
    <Suspense>
      <NewStatementPageInner />
    </Suspense>
  )
}
