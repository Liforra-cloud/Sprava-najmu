// app/expenses/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { X, Plus, Edit, Trash2, ArrowDownAZ, ArrowUpAZ, Search } from 'lucide-react'

interface Expense {
  id: string
  property_id: string
  unit_id: string | null
  amount: number
  description: string
  expense_type?: string | null
  date_incurred: string
}

interface Property {
  id: string
  name: string
}

interface Unit {
  id: string
  identifier: string
  property_id: string
}

type SortField = 'date_incurred' | 'amount' | 'unit_id' | 'property_id' | 'expense_type'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('date_incurred')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Formulář pro přidání/editaci
  const [form, setForm] = useState({
    property_id: '',
    unit_id: '',
    amount: '',
    description: '',
    expense_type: '',
    date_incurred: new Date().toISOString().slice(0, 10)
  })
  const [saving, setSaving] = useState(false)

  // Načtení nemovitostí a jednotek pro selecty
  useEffect(() => {
    const fetchMeta = async () => {
      const [propRes, unitRes] = await Promise.all([
        fetch('/api/properties', { credentials: 'include' }),
        fetch('/api/units', { credentials: 'include' })
      ])
      const props = await propRes.json()
      const units = await unitRes.json()
      setProperties(props)
      setUnits(units)
    }
    fetchMeta()
  }, [])

  // Načtení nákladů podle filtru
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedProperty) params.append('property_id', selectedProperty)
    if (selectedUnit) params.append('unit_id', selectedUnit)
    fetch('/api/expenses?' + params.toString(), { credentials: 'include' })
      .then(res => res.json())
      .then(setExpenses)
  }, [selectedProperty, selectedUnit, saving, showModal])

  // Filtr podle data
  const filteredByDate = expenses.filter(exp => {
    let include = true
    if (dateFrom) include = include && exp.date_incurred >= dateFrom
    if (dateTo) include = include && exp.date_incurred <= dateTo
    return include
  })

  // CHYTRÉ FULLTEXT HLEDÁNÍ
  const filteredByText = filteredByDate.filter(exp => {
    if (!searchText.trim()) return true
    const lower = searchText.toLowerCase()
    // Porovnáváme všechny důležité sloupce + property/jednotku
    return (
      exp.description?.toLowerCase().includes(lower) ||
      (exp.expense_type || '').toLowerCase().includes(lower) ||
      exp.amount.toString().includes(lower) ||
      (properties.find(p => p.id === exp.property_id)?.name.toLowerCase().includes(lower) ?? false) ||
      (units.find(u => u.id === exp.unit_id)?.identifier.toLowerCase().includes(lower) ?? false)
    )
  })

  // Řazení - žádné "any", jen union
  const sortedExpenses = [...filteredByText].sort((a, b) => {
    let valA: string | number | undefined
    let valB: string | number | undefined
    if (sortBy === 'unit_id') {
      valA = units.find(u => u.id === a.unit_id)?.identifier || ''
      valB = units.find(u => u.id === b.unit_id)?.identifier || ''
    } else if (sortBy === 'property_id') {
      valA = properties.find(p => p.id === a.property_id)?.name || ''
      valB = properties.find(p => p.id === b.property_id)?.name || ''
    } else if (sortBy === 'date_incurred') {
      valA = a.date_incurred
      valB = b.date_incurred
    } else if (sortBy === 'amount') {
      valA = Number(a.amount)
      valB = Number(b.amount)
    } else if (sortBy === 'expense_type') {
      valA = a.expense_type || ''
      valB = b.expense_type || ''
    }
    if (valA! < valB!) return sortDir === 'asc' ? -1 : 1
    if (valA! > valB!) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  // Filtr dostupných jednotek podle vybrané nemovitosti
  const filteredUnits = selectedProperty
    ? units.filter(u => u.property_id === selectedProperty)
    : units

  // Otevře modal pro nový náklad
  const openNewModal = () => {
    setEditingExpense(null)
    setForm({
      property_id: selectedProperty || '',
      unit_id: '',
      amount: '',
      description: '',
      expense_type: '',
      date_incurred: new Date().toISOString().slice(0, 10)
    })
    setShowModal(true)
  }

  // Otevře modal pro editaci
  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense)
    setForm({
      property_id: expense.property_id || '',
      unit_id: expense.unit_id || '',
      amount: expense.amount.toString(),
      description: expense.description,
      expense_type: expense.expense_type || '',
      date_incurred: expense.date_incurred
    })
    setShowModal(true)
  }

  // Uloží nový nebo editovaný náklad
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      property_id: form.property_id,
      unit_id: form.unit_id || null,
      amount: parseFloat(form.amount),
      description: form.description,
      expense_type: form.expense_type || null,
      date_incurred: form.date_incurred
    }
    let url = '/api/expenses'
    let method = 'POST'
    if (editingExpense) {
      url = `/api/expenses/${editingExpense.id}`
      method = 'PATCH'
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      setShowModal(false)
    } else {
      alert('Nepodařilo se uložit náklad.')
    }
    setSaving(false)
  }

  // Smazání nákladu
  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat tento náklad?')) return
    setSaving(true)
    await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    setSaving(false)
  }

  // Suma aktuálně zobrazených nákladů
  const total = sortedExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Helper pro přepnutí řazení
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Náklady</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={openNewModal}>
          <Plus size={18} /> Přidat náklad
        </button>
      </div>

      {/* Filtry */}
      <div className="flex gap-4 mb-4 flex-wrap items-end">
        <div>
          <label className="text-sm">Nemovitost:</label>
          <select
            className="border rounded px-2 py-1 ml-2"
            value={selectedProperty}
            onChange={e => { setSelectedProperty(e.target.value); setSelectedUnit('') }}
          >
            <option value="">Všechny</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Jednotka:</label>
          <select
            className="border rounded px-2 py-1 ml-2"
            value={selectedUnit}
            onChange={e => setSelectedUnit(e.target.value)}
            disabled={!selectedProperty}
          >
            <option value="">Všechny</option>
            {filteredUnits.map(u => (
              <option key={u.id} value={u.id}>{u.identifier}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Od:</label>
          <input
            type="date"
            className="border rounded px-2 py-1 ml-2"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Do:</label>
          <input
            type="date"
            className="border rounded px-2 py-1 ml-2"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
        {/* Fulltext hledání */}
        <div className="flex items-center border rounded px-2 py-1 ml-2 bg-white shadow-sm">
          <Search size={18} className="mr-1 text-gray-400" />
          <input
            type="text"
            placeholder="Hledat náklad..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="outline-none border-none bg-transparent"
            style={{ minWidth: 120 }}
          />
        </div>
      </div>

      {/* Suma */}
      <div className="mb-4 text-lg font-medium">
        Celkové náklady: <span className="text-blue-700">{total.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}</span>
      </div>

      {/* Výpis nákladů */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left cursor-pointer" onClick={() => handleSort('date_incurred')}>
                Datum{' '}
                {sortBy === 'date_incurred' ? (
                  sortDir === 'asc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />
                ) : null}
              </th>
              <th className="p-2 text-left">Popis</th>
              <th className="p-2 text-left cursor-pointer" onClick={() => handleSort('expense_type')}>
                Typ{' '}
                {sortBy === 'expense_type' ? (
                  sortDir === 'asc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />
                ) : null}
              </th>
              <th className="p-2 text-right cursor-pointer" onClick={() => handleSort('amount')}>
                Částka (Kč){' '}
                {sortBy === 'amount' ? (
                  sortDir === 'asc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />
                ) : null}
              </th>
              <th className="p-2 text-left cursor-pointer" onClick={() => handleSort('property_id')}>
                Nemovitost{' '}
                {sortBy === 'property_id' ? (
                  sortDir === 'asc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />
                ) : null}
              </th>
              <th className="p-2 text-left cursor-pointer" onClick={() => handleSort('unit_id')}>
                Jednotka{' '}
                {sortBy === 'unit_id' ? (
                  sortDir === 'asc' ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />
                ) : null}
              </th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">Žádné náklady</td>
              </tr>
            )}
            {sortedExpenses.map(exp => (
              <tr key={exp.id} className="border-t">
                <td className="p-2">{new Date(exp.date_incurred).toLocaleDateString()}</td>
                <td className="p-2">{exp.description}</td>
                <td className="p-2">{exp.expense_type || '—'}</td>
                <td className="p-2 text-right">{exp.amount.toLocaleString('cs-CZ')}</td>
                <td className="p-2">
                  {properties.find(p => p.id === exp.property_id)?.name || '—'}
                </td>
                <td className="p-2">
                  {units.find(u => u.id === exp.unit_id)?.identifier || (exp.unit_id ? exp.unit_id : '—')}
                </td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => openEditModal(exp)} className="text-blue-700 hover:underline flex items-center">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(exp.id)} className="text-red-600 hover:underline flex items-center">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: Přidat/upravit náklad */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[350px] max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setShowModal(false)}>
              <X />
            </button>
            <h2 className="text-xl font-bold mb-3">{editingExpense ? 'Upravit náklad' : 'Přidat náklad'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-sm">Nemovitost:</label>
                <select
                  required
                  className="border rounded px-2 py-1 w-full"
                  value={form.property_id}
                  onChange={e => {
                    setForm(f => ({ ...f, property_id: e.target.value, unit_id: '' }))
                  }}
                  disabled={!!editingExpense}
                >
                  <option value="">Vyber nemovitost</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm">Jednotka (volitelně):</label>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={form.unit_id}
                  onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}
                  disabled={!form.property_id}
                >
                  <option value="">Nepřiřazeno</option>
                  {units.filter(u => u.property_id === form.property_id).map(u => (
                    <option key={u.id} value={u.id}>{u.identifier}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm">Popis:</label>
                <input
                  required
                  type="text"
                  className="border rounded px-2 py-1 w-full"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm">Typ (volitelně):</label>
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full"
                  value={form.expense_type}
                  onChange={e => setForm(f => ({ ...f, expense_type: e.target.value }))}
                  placeholder="např. pojištění, oprava..."
                />
              </div>
              <div>
                <label className="block text-sm">Částka (Kč):</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="border rounded px-2 py-1 w-full"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm">Datum:</label>
                <input
                  required
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={form.date_incurred}
                  onChange={e => setForm(f => ({ ...f, date_incurred: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={saving} className="w-full mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {saving ? 'Ukládám...' : editingExpense ? 'Uložit změny' : 'Přidat náklad'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
