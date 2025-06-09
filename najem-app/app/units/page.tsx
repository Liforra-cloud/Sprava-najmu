// app/units/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/units")
      .then(res => res.json())
      .then(data => setUnits(data));
  }, []);

  return (
    <div>
      <h1>Jednotky</h1>
      <a href="/units/add">Přidat jednotku</a>
      <ul>
        {units.map((unit) => (
          <li key={unit.id}>
            <strong>{unit.unit_number}</strong> – {unit.floor}. patro, {unit.area} m², {unit.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
