// app/units/[id]/page.tsx

"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditUnitPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [form, setForm] = useState({
    property_id: "",
    unit_number: "",
    floor: "",
    area: "",
    description: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUnit() {
      const res = await fetch(`/api/units/${id}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          property_id: data.property_id || "",
          unit_number: data.unit_number || "",
          floor: data.floor || "",
          area: data.area || "",
          description: data.description || ""
        });
      }
      setLoading(false);
    }
    if (id) fetchUnit();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/units/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    router.push("/units");
  };

  const handleDelete = async () => {
    if (confirm("Opravdu smazat tuto jednotku?")) {
      await fetch(`/api/units/${id}`, { method: "DELETE" });
      router.push("/units");
    }
  };

  if (loading) return <div>Načítání...</div>;

  return (
    <main>
      <h1>Editace jednotky</h1>
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
        <button type="submit">Uložit změny</button>
      </form>
      <button onClick={handleDelete} style={{ color: "red", marginTop: 12 }}>
        Smazat jednotku
      </button>
    </main>
  );
}
