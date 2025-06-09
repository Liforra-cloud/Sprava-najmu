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
    <main>
      <h1>Přidat jednotku</h1>
      <form onSubmit={handleSubmit}>
        <label>
          ID nemovitosti (property_id):
          <input name="property_id" value={form.property_id} onChange={handleChange} required />
        </label>
        <label>
          Číslo jednotky:
          <input name="unit_number" value={form.unit_number} onChange={handleChange} required />
        </label>
        <label>
          Patro:
          <input name="floor" value={form.floor} onChange={handleChange} />
        </label>
        <label>
          Plocha (m²):
          <input name="area" value={form.area} onChange={handleChange} />
        </label>
        <label>
          Popis:
          <textarea name="description" value={form.description} onChange={handleChange} />
        </label>
        <button type="submit">Přidat jednotku</button>
      </form>
    </main>
  );
}
