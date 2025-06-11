// components/ExpensesList.tsx

'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Edit, Trash2, X } from 'lucide-react'

type Expense = {
  id: string
  property_id: string
  unit_id: string | null
  amount: number
  description: string
  expense_type?: string | null
  date_incurred: string
}

type Unit = { id: string; identifier: string }
type Property = { id: string; name: string }

type Props = {
  propertyId?: string
  unitId?: string
  properties?: Property[]
  units?: Unit[]
  showPropertyColumn?: boolean
  showUnitColumn?: boolean
}

export default function ExpensesList({
  propertyId,
  unitId,
  properties = [],
  units = [],
  showPropertyColumn = false,
  showUnitColumn = false,
}: Props) {
  // Filtry a stav
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState({
    amount: '',
    description: '',
    expense_type: '',
    date_incurred: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)

  // FILTRY
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [onlyUnit, setOnlyUnit] = useState(false)
  const [onlyProperty, setOnlyProperty] = useState(false)
  const [sortBy, setSortBy] = useState('date_incurred_desc')

  // Načti náklady
  useEffect(() => {
    const params = new URLSearchParams()
    if (propertyId) params.append('property_id', propertyId)
    if (unitId) params.append('unit_id', unitId)
    fetch('/api/expenses?' + params.toString(), { credentials: 'include' })
      .then((res) => res.json())
      .then(setExpenses)
  }, [propertyId, unitId, saving, showModal])

  // Chytré filtry a řazení (useMemo kvůli výkonu)
  const filteredExpenses = useMemo(() => {
    let result = [...expenses]
    if (searchText)
      result = result.filter(e =>
        [e.description, e.expense_type, e.amount, e.date_incurred]
          .map(x => (x ?? '').toString().toLowerCase())
          .some(x => x.includes(searchText.toLowerCase()))
      )
    if (filterType)
      result = result.filter(e => (e.expense_type ?? '') === filterType)
    if (dateFrom)
      result = result.filter(e => e.date_incurred >= dateFrom)
    if (dateTo)
      result = result.filter(e => e.date_incurred <= dateTo)
    if (onlyUnit)
      result = result.filter(e => e.unit_id)
    if (onlyProperty)
      result = result.filter(e => !e.unit_id)
    // Řazení
    result = result.sort((a, b) => {
      if (sortBy === 'date_incurred_desc') return b.date_incurred.localeCompare(a.date_incurred)
      if (sortBy === 'date_incurred_asc') return a.date_incurred.localeCompare(b.date_incurred)
      if (sortBy === 'amount_desc') return Number(b.amount) - Number(a.amount)
      if (sortBy === 'amount_asc') return Number(a.amount) - Number(b.amount)
      return 0
    })
    return result
  }, [expenses, searchText, filterType, dateFrom, dateTo, onlyUnit, onlyProperty, sortBy])

  // Typy nákladů na select
  const allTypes = Array.from(new Set(expenses.map(e => e.expense_type).filter(Boolean))) as string[]

  // Přidání/úprava
  const openNewModal = () => {
    setEditingExpense(null)
    setForm({
      amount: '',
      description: '',
      expense_type: '',
      date_incurred: new Date().toISOString().slice(0, 10),
    })
    setShowModal(true)
  }
  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp)
    setForm({
      amount: exp.amount.toString(),
      description: exp.description,
      expense_type: exp.expense_type || '',
      date_incurred: exp.date_incurred,
    })
    setShowModal(true)
  }
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      property_id: propertyId,
      unit_id: unitId || null,
      amount: parseFloat(form.amount),
      description: form.description,
      expense_type: form.expense_type || null,
      date_incurred: form.date_incurred,
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
      body: JSON.stringify(payload),
    })
    if (res.ok) setShowModal(false)
    else alert('Nepodařilo se uložit náklad.')
    setSaving(false)
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat tento náklad?')) return
    setSaving(true)
    await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setSaving(false)
  }
  const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="mt-6">
      {/* Filtry */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Hledat…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Všechny typy</option>
          {allTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1" />
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={onlyUnit} onChange={e => setOnlyUnit(e.target.checked)} />
          Jen k jednotce
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={onlyProperty} onChange={e => setOnlyProperty(e.target.checked)} />
          Jen k nemovitosti
        </label>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded px-2 py-1">
          <option value="date_incurred_desc">Nejnovější</option>
          <option value="date_incurred_asc">Nejstarší</option>
          <option value="amount_desc">Nejdražší</option>
          <option value="amount_asc">Nejlevnější</option>
        </select>
        <button className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 ml-auto" onClick={openNewModal}>
          <Plus size={16} /> Přidat náklad
        </button>
      </div>

      <div className="mb-2 text-sm text-gray-600">
        Celkem: <span className="font-medium">{total.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}</span>
      </div>
      <table className="min-w-full border rounded shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Datum</th>
            <th className="p-2 text-left">Popis</th>
            <th className="p-2 text-left">Typ</th>
            <th className="p-2 text-right">Částka</th>
            {showPropertyColumn && <th className="p-2 text-left">Nemovitost</th>}
            {showUnitColumn && <th className="p-2 text-left">Jednotka</th>}
            <th className="p-2 text-center">Kam patří</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.length === 0 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-gray-500">Žádné náklady</td>
            </tr>
          )}
          {filteredExpenses.map(exp => (
            <tr key={exp.id} className="border-t">
              <td className="p-2">{new Date(exp.date_incurred).toLocaleDateString()}</td>
              <td className="p-2">{exp.description}</td>
              <td className="p-2">{exp.expense_type || '—'}</td>
              <td className="p-2 text-right">{exp.amount.toLocaleString('cs-CZ')}</td>
              {showPropertyColumn && (
                <td className="p-2">{properties.find(p => p.id === exp.property_id)?.name || '—'}</td>
              )}
              {showUnitColumn && (
                <td className="p-2">{units.find(u => u.id === exp.unit_id)?.identifier || '—'}</td>
              )}
              <td className="p-2 text-center">
                {exp.unit_id
                  ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">Jednotka</span>
                  : <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Nemovitost</span>
                }
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
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[350px] max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setShowModal(false)}>
              <X />
            </button>
            <h3 className="text-lg font-bold mb-3">{editingExpense ? 'Upravit náklad' : 'Přidat náklad'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
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
                  list="expenseTypeList"
                />
                <datalist id="expenseTypeList">
                  {allTypes.map(t => <option key={t} value={t} />)}
                </datalist>
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
