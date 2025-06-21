// components/StatementTable.tsx

import React, { useState } from "react";

type StatementRow = {
  name: string;
  unit?: string;
  consumption?: number;
  advances: number;
  totalCost?: number;
  monthsBilled: number;
  monthsTotal: number;
  editable?: boolean;
  nonBillable?: boolean; // přidané uživatelem, nikdy nebylo účtovatelné
};

type Props = {
  rows: StatementRow[];
  onChange?: (rows: StatementRow[]) => void;
  nonBillableCandidates?: string[];
};

export default function StatementTable({ rows: initialRows, onChange, nonBillableCandidates = [] }: Props) {
  const [rows, setRows] = useState<StatementRow[]>(initialRows);

  // pomocná funkce na přepočet přeplatku/nedoplatku
  const computeDiff = (row: StatementRow) => {
    const total = row.totalCost ?? 0;
    const advances = row.advances ?? 0;
    return total - advances;
  };

  const handleRowChange = (index: number, field: keyof StatementRow, value: string | number) => {
    const newRows = [...rows];
    // čísla převádět
    newRows[index][field] = typeof value === "string" && field !== "name" && field !== "unit"
      ? Number(value) || 0
      : value;
    setRows(newRows);
    onChange?.(newRows);
  };

  const handleDelete = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    onChange?.(newRows);
  };

  // Přidání položky ze seznamu neúčtovatelných kandidátů
  const [addingName, setAddingName] = useState("");
  const handleAddRow = () => {
    if (!addingName) return;
    setRows([
      ...rows,
      {
        name: addingName,
        advances: 0,
        totalCost: 0,
        monthsBilled: 0,
        monthsTotal: 0,
        nonBillable: true,
        editable: true,
      },
    ]);
    setAddingName("");
  };

  return (
    <div>
      <table className="min-w-full bg-white border border-gray-300 mb-4">
        <thead>
          <tr>
            <th className="border px-2 py-1">Název</th>
            <th className="border px-2 py-1">Zálohy</th>
            <th className="border px-2 py-1">Spotřeba</th>
            <th className="border px-2 py-1">Jednotka</th>
            <th className="border px-2 py-1">Náklady celkem</th>
            <th className="border px-2 py-1">Počet účtovaných měsíců</th>
            <th className="border px-2 py-1">Přeplatek / Nedoplatek</th>
            <th className="border px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.name + idx}>
              <td className="border px-2 py-1">
                {row.editable ? (
                  <input
                    className="border rounded px-1 py-0.5 w-28"
                    value={row.name}
                    onChange={e => handleRowChange(idx, "name", e.target.value)}
                  />
                ) : row.name}
                {row.monthsBilled < row.monthsTotal && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({row.monthsBilled}× z {row.monthsTotal})
                  </span>
                )}
                {row.nonBillable && (
                  <span className="ml-1 text-xs text-orange-600">(neúčtovatelné)</span>
                )}
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  className="border rounded px-1 py-0.5 w-20"
                  value={row.advances}
                  onChange={e => handleRowChange(idx, "advances", e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  className="border rounded px-1 py-0.5 w-20"
                  value={row.consumption ?? ""}
                  onChange={e => handleRowChange(idx, "consumption", e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  className="border rounded px-1 py-0.5 w-14"
                  value={row.unit ?? ""}
                  onChange={e => handleRowChange(idx, "unit", e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  className="border rounded px-1 py-0.5 w-24"
                  value={row.totalCost ?? ""}
                  onChange={e => handleRowChange(idx, "totalCost", e.target.value)}
                />
              </td>
              <td className="border px-2 py-1 text-center">
                {row.monthsBilled} / {row.monthsTotal}
              </td>
              <td className="border px-2 py-1 text-center">
                <span
                  className={
                    computeDiff(row) < 0
                      ? "text-green-600 font-bold"
                      : computeDiff(row) > 0
                      ? "text-red-600 font-bold"
                      : ""
                  }
                >
                  {computeDiff(row)}
                </span>
              </td>
              <td className="border px-2 py-1 text-center">
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => handleDelete(idx)}
                  title="Smazat řádek"
                >
                  Smazat
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center space-x-2 mb-4">
        <select
          className="border rounded px-2 py-1"
          value={addingName}
          onChange={e => setAddingName(e.target.value)}
        >
          <option value="">Přidat položku…</option>
          {nonBillableCandidates
            .filter(name => !rows.some(row => row.name === name))
            .map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          <option value="__new__">Nová položka…</option>
        </select>
        {addingName && addingName !== "__new__" && (
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={handleAddRow}
          >
            Přidat
          </button>
        )}
        {addingName === "__new__" && (
          <input
            className="border rounded px-2 py-1"
            placeholder="Název nové položky"
            onBlur={e => setAddingName(e.target.value)}
            autoFocus
          />
        )}
      </div>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={() => setRows([...rows])} // “přepočet” - v tomto případě jen re-render (můžeš navázat reálný přepočet)
      >
        Přepočítat přeplatky
      </button>
    </div>
  );
}
