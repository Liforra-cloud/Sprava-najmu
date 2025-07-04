// /components/ExpensesList.tsx

'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, X, FileText } from 'lucide-react'
import DocumentUpload from '@/components/DocumentUpload'
import DocumentList from '@/components/DocumentList'

type Expense = {
  id: string
  property_id: string
  unit_id: string | null
  amount: number
  description: string
  expense_type?: string | null
  date_incurred: string
}

type Props = {
  propertyId?: string
  unitId?: string
}

export default function ExpensesList({
  propertyId,
  unitId
}: Props) {
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
  const [openedDocs, setOpenedDocs] = useState<string | null>(null)
  const [refreshDocs, setRefreshDocs] = useState(0)

  // Filtry
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [onlyUnits, setOnlyUnits] = useState(false)
  const [onlyProperties, setOnlyProperties] = useState(false)
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')

  // Načti náklady k nemovitosti/jednotce
  useEffect(() => {
    const params = new URLSearchParams()
    if (propertyId) params.append('property_id', propertyId)
    if (unitId) params.append('unit_id', unitId)
    fetch('/api/expenses?' + params.toString(), { credentials: 'include' })
      .then((res) => res.json())
      .then(setExpenses)
  }, [propertyId, unitId, saving, showModal, refreshDocs])

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

  // ** FILTROVÁNÍ A ŘAZENÍ **
  const filtered = expenses
    .filter((e) =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.expense_type || '').toLowerCase().includes(search.toLowerCase())
    )
    .filter((e) => (filterType ? e.expense_type === filterType : true))
    .filter((e) => (filterFrom ? e.date_incurred >= filterFrom : true))
    .filter((e) => (filterTo ? e.date_incurred <= filterTo : true))
    .filter((e) => (onlyUnits ? !!e.unit_id : true))
    .filter((e) => (onlyProperties ? !e.unit_id : true))
    .sort((a, b) =>
      sort === 'newest'
        ? b.date_incurred.localeCompare(a.date_incurred)
        : a.date_incurred.localeCompare(b.date_incurred)
    )

  // Unikátní typy nákladů pro filtr
  const allTypes = Array.from(new Set(expenses.map(e => e.expense_type).filter(Boolean) as string[]))

  const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="mt-6">
      {/* Nadpis a popis */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Náklady</h2>
        <p className="text-gray-600 text-sm mb-2">
          Evidujte provozní, investiční nebo administrativní náklady vztahující se k této nemovitosti nebo jednotce.
        </p>
        {/* FILTRY */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 flex flex-wrap gap-3 items-end shadow-sm">
          <input
            type="text"
            className="border px-2 py-1 rounded w-40"
            placeholder="Hledat…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="border px-2 py-1 rounded"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">Všechny typy</option>
            {allTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input
            type="date"
            className="border px-2 py-1 rounded"
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
            placeholder="Od"
          />
          <input
            type="date"
            className="border px-2 py-1 rounded"
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
            placeholder="Do"
          />
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              className="accent-blue-600"
              checked={onlyUnits}
              onChange={e => setOnlyUnits(e.target.checked)}
            /> Jen k jednotce
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              className="accent-blue-600"
              checked={onlyProperties}
              onChange={e => setOnlyProperties(e.target.checked)}
            /> Jen k nemovitosti
          </label>
          <select
            className="border px-2 py-1 rounded"
            value={sort}
            onChange={e => setSort(e.target.value as 'newest' | 'oldest')}
          >
            <option value="newest">Nejnovější</option>
            <option value="oldest">Nejstarší</option>
          </select>
          <button
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={openNewModal}
          >
            <Plus size={16} className="inline mr-1" /> Přidat náklad
          </button>
        </div>
      </div>

      {/* CELKEM */}
      <div className="mb-2 text-base text-gray-600">
        Celkem: <span className="font-semibold">{total.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}</span>
      </div>

      {/* TABULKA */}
      <table className="min-w-full border rounded shadow-sm bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left font-bold">Datum</th>
            <th className="p-2 text-left font-bold">Popis</th>
            <th className="p-2 text-left font-bold">Typ</th>
            <th className="p-2 text-right font-bold">Částka</th>
            <th className="p-2 text-center font-bold">Kam patří</th>
            <th className="p-2 text-center font-bold">Dokumenty</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-gray-500">Žádné náklady</td>
            </tr>
          )}
          {filtered.map(exp => (
            <tr key={exp.id} className="border-t">
              <td className="p-2">{new Date(exp.date_incurred).toLocaleDateString()}</td>
              <td className="p-2">{exp.description}</td>
              <td className="p-2">{exp.expense_type || '—'}</td>
              <td className="p-2 text-right">{exp.amount.toLocaleString('cs-CZ')}</td>
              <td className="p-2 text-center">
                {exp.unit_id
                  ? <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">Jednotka</span>
                  : <span className="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-semibold">Nemovitost</span>
                }
              </td>
              {/* DOKUMENTY */}
              <td className="p-2 text-center">
                <button
                  title="Zobrazit dokumenty"
                  onClick={() => setOpenedDocs(openedDocs === exp.id ? null : exp.id)}
                  className="hover:text-blue-600"
                >
                  <FileText size={18} />
                </button>
              </td>
              <td className="p-2 flex gap-2 justify-center">
                <button onClick={() => openEditModal(exp)} className="text-blue-700 hover:underline flex items-center" title="Upravit">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(exp.id)} className="text-red-600 hover:underline flex items-center" title="Smazat">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Dokumenty ke konkrétnímu nákladu */}
      {filtered.map(exp => (
        openedDocs === exp.id && (
          <div key={`docs-${exp.id}`} className="my-4 border border-blue-200 rounded p-4 bg-blue-50">
            <h4 className="font-semibold mb-2">Dokumenty pro náklad: <span className="font-normal">{exp.description}</span></h4>
            <DocumentUpload expenseId={exp.id} onUpload={() => setRefreshDocs(r => r + 1)} />
            <DocumentList expenseId={exp.id} onChange={() => setRefreshDocs(r => r + 1)} />
          </div>
        )
      ))}

      {/* MODÁL */}
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
