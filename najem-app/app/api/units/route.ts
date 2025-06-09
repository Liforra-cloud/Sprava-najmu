// app/api/units/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Typ pro property (můžeš upravit podle své struktury)
type Property = { id: string };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();
  const {
    property_id,
    identifier,
    floor,
    disposition,
    area,
    occupancy_status,
    monthly_rent,
    deposit,
    description,
  } = body;

  // Debug: vypiš co dostáváš z frontendu
  console.log("property_id z frontendu:", property_id);

  // Načti všechna id z tabulky properties
  const { data: propertyList, error: propertyListError } = await supabase
    .from("properties")
    .select("id");

  console.log("Seznam všech id z properties:", propertyList);
  if (propertyListError) {
    return NextResponse.json(
      { error: "Chyba při čtení tabulky properties: " + propertyListError.message },
      { status: 500 }
    );
  }

  // Typování propertyList
  const exists = (propertyList as Property[]).some((p) => String(p.id) === String(property_id));
  console.log("exists:", exists);

  if (!exists) {
    return NextResponse.json(
      {
        error:
          "Nemovitost nebyla nalezena (ani přes přímé porovnání). property_id=" +
          property_id +
          ". Všechny id v DB: " +
          (propertyList as Property[]).map((p) => p.id).join(", "),
      },
      { status: 400 }
    );
  }

  // Pokud existuje, proveď insert do units
  const { data, error } = await supabase
    .from("units")
    .insert([
      {
        property_id,
        identifier,
        floor,
        disposition,
        area,
        occupancy_status,
        monthly_rent,
        deposit,
        description,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
