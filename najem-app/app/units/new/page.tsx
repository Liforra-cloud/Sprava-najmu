// app/units/new/page.tsx

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const occupancyOptions = [
  { value: "volné", label: "Volné" },
  { value: "obsazené", label: "Obsazené" },
  { value: "rezervováno", label: "Rezervováno" }
  // Přidej další možnosti podle enumu v DB, pokud máš víc stavů!
];

export default function NewUnitPage() {
  const [unitNumber, setUnitNumber] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [floor, setFloor] = useState("");
  const [disposition, setDisposition] = useState("");
  const [area, setArea] = useState("");
  const [occupancyStatus, setOccupancyStatus] = useState("volné");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_number: unitNumber,
        property_id: propertyId,
        floor: floor !== "" ? Number(floor) : null,
        disposition,
        area: area !== "" ? Number(area) : null,
        occupancy_status: occupancyStatus,
        monthly_rent: monthlyRent !== "" ? Number(monthlyRent) : null,
        deposit: deposit !== "" ? Number(deposit) : null,
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
          type="text"
          placeholder="Dispozice (např. 2+kk)"
          value={disposition}
          onChange={(e) => setDisposition(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Plocha (m²)"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
        <select
          value={occupancyStatus}
          onChange={(e) => setOccupancyStatus(e.target.value)}
        >
          {occupancyOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Měsíční nájem (Kč)"
          value={monthlyRent}
          onChange={(e) => setMonthlyRent(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Kauce (Kč)"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
        />
        <textarea
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
