// app/units/page.tsx

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Unit = {
  id: string;
  property_id: string;
  identifier: string; // změna!
  floor: number | null;
  area: number | null;
  description: string | null;
};

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    fetch("/api/units")
      .then(res => res.json())
      .then(data => setUnits(data));
  }, []);

  return (
    <main>
      <h1>Jednotky</h1>
      <Link href="/units/new">Přidat jednotku</Link>
      <ul>
        {units.map((unit) => (
          <li key={unit.id}>
            <strong>{unit.identifier}</strong>
            {unit.floor !== null && <> – {unit.floor}. patro</>}
            {unit.area !== null && <>, {unit.area} m²</>}
            {unit.description && <>, {unit.description}</>}
            {" "}
            <Link href={`/units/${unit.id}`}>Editovat</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

