// app/units/new/page.tsx

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddUnitPage() {
  const router = useRouter();
  const [form, setForm] = useState({
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
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        padding: 40,
      }}
    >
      <h1
        style={{
          fontSize: 36,
          fontWeight: 800,
          marginBottom: 32,
          letterSpacing: "-0.03em",
        }}
      >
        Přidat jednotku
      </h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="unit_number" style={{ fontWeight: 700, fontSize: 18 }}>
            Číslo jednotky
          </label>
          <input
            name="unit_number"
            id="unit_number"
            value={form.unit_number}
            onChange={handleChange}
            placeholder="Např. 1A, 2.05, Byt 3"
            required
            style={{
              padding: "16px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 18,
              background: "#fafbfc",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="floor" style={{ fontWeight: 700, fontSize: 18 }}>
            Patro
          </label>
          <input
            name="floor"
            id="floor"
            value={form.floor}
            onChange={handleChange}
            placeholder="Např. 2"
            style={{
              padding: "16px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 18,
              background: "#fafbfc",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="area" style={{ fontWeight: 700, fontSize: 18 }}>
            Plocha (m²)
          </label>
          <input
            name="area"
            id="area"
            value={form.area}
            onChange={handleChange}
            placeholder="Např. 56"
            style={{
              padding: "16px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 18,
              background: "#fafbfc",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="description" style={{ fontWeight: 700, fontSize: 18 }}>
            Popis (volitelný)
          </label>
          <textarea
            name="description"
            id="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Např. Byt s balkonem, nově vymalováno..."
            style={{
              padding: "16px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 18,
              background: "#fafbfc",
              resize: "vertical",
              minHeight: 60,
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            marginTop: 8,
            padding: "18px 0",
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            background: "#2563eb",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            width: "100%",
            transition: "background 0.15s",
          }}
        >
          Přidat jednotku
        </button>
      </form>
    </div>
  );
}
