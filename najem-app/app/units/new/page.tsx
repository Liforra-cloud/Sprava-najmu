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
    <div style={{
      maxWidth: 600,
      margin: "40px auto",
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      padding: 32
    }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Přidat jednotku</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="property_id" style={{ fontWeight: 600 }}>ID nemovitosti (property_id)</label>
          <input
            name="property_id"
            id="property_id"
            value={form.property_id}
            onChange={handleChange}
            placeholder="Např. 82fdbbfd-... (nebo automatický výběr)"
            required
            style={{ padding: 12, borderRadius: 8, border: "1px solid #eee", fontSize: 16 }}
          />
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="unit_number" style={{ fontWeight: 600 }}>Číslo jednotky</label>
            <input
              name="unit_number"
              id="unit_number"
              value={form.unit_number}
              onChange={handleChange}
              placeholder="Např. 1A, 2.05, Byt 3"
              required
              style={{ padding: 12, borderRadius: 8, border: "1px solid #eee", fontSize: 16 }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="floor" style={{ fontWeight: 600 }}>Patro</label>
            <input
              name="floor"
              id="floor"
              value={form.floor}
              onChange={handleChange}
              placeholder="Např. 2"
              style={{ padding: 12, borderRadius: 8, border: "1px solid #eee", fontSize: 16 }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="area" style={{ fontWeight: 600 }}>Plocha (m²)</label>
            <input
              name="area"
              id="area"
              value={form.area}
              onChange={handleChange}
              placeholder="Např. 56"
              style={{ padding: 12, borderRadius: 8, border: "1px solid #eee", fontSize: 16 }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="description" style={{ fontWeight: 600 }}>Popis (volitelný)</label>
            <textarea
              name="description"
              id="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Např. Byt s balkonem, nově vymalováno..."
              style={{ padding: 12, borderRadius: 8, border: "1px solid #eee", fontSize: 16, resize: "vertical", minHeight: 48 }}
            />
          </div>
        </div>
        <button type="submit" style={{
          marginTop: 8,
          padding: "14px 0",
          fontSize: 18,
          fontWeight: 600,
          color: "#fff",
          background: "#2563eb",
          borderRadius: 8,
          border: "none",
          cursor: "pointer"
        }}>Přidat jednotku</button>
      </form>
    </div>
  );
}
