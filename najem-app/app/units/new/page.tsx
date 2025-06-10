// app/units/new/page.tsx

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUnitPage() {
  const [unitNumber, setUnitNumber] = useState("");
  const [propertyId, setPropertyId] = useState(""); // předvyplň, nebo doplň selectem
  const [floor, setFloor] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // !!! Tohle je klíčové - posíláme unit_number !!!
    const res = await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_number: unitNumber,
        property_id: propertyId,
        floor,
        area,
        description,
      }),
    });

    if (res.ok) {
      router.push("/units");
    } else {
      const { error } = await res.json();
      setError(error);
    }
  };

  return (
    <main>
      <h1>Přidat jednotku</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Označení jednotky"
          value={unitNumber}
          onChange={(e) => setUnitNumber(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Nemovitost (property_id)"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Patro"
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
        />
        <input
          type="number"
          placeholder="Plocha"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
        <input
          type="text"
          placeholder="Popis"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Uložit jednotku</button>
      </form>
    </main>
  );
}

