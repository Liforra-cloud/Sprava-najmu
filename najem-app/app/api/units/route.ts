// app/api/units/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // Načtení všech jednotek pro přihlášeného uživatele
  // (v reálné appce použít session, tady pro ukázku neřeším autorizaci)
  const { data, error } = await supabase
    .from("units")
    .select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  // Zde by bylo lepší validovat vstupní data!
  const { property_id, unit_number, floor, area, description, user_id } = body;

  const { data, error } = await supabase
    .from("units")
    .insert([
      { property_id, unit_number, floor, area, description, user_id }
    ])
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data[0]);
}

