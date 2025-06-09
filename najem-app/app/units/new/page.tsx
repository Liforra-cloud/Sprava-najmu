// app/units/new/page.tsx

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddUnitPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    property_id: "",
    unit_number: "",
    floor: "",
    area: "",
    description: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    router.push("/units");
  };

  return (
    <main style={{ maxWidth: 500, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Přidat jednotku</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label htmlFor="property_id">ID nemovitosti (property_id):</label>
          <input name="property_id" id="property_id" value={form.property_id} onChange={handleChange} required />
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <label htmlFor="unit_number">Číslo jednotky:</label>
            <input name="unit_number" id="unit_number" value={form.unit_number} onChange={handleChange} required />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <label htmlFor="floor">Patro:</label>
            <input name="floor" id="floor" value={form.floor} onChange={handleChange} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <label htmlFor="area">Plocha (m²):</label>
            <input name="area" id="area" value={form.area} onChange={handleChange} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <label htmlFor="description">Popis:</label>
            <textarea name="description" id="description" value={form.description} onChange={handleChange} />
          </div>
        </div>
        <button type="submit" style={{ marginTop: 16, padding: "8px 16px" }}>Přidat jednotku</button>
      </form>
    </main>
  );
}
