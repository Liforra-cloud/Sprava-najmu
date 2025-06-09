// app/api/units/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: všechny jednotky
export async function GET() {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("identifier", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST: vytvořit novou jednotku
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
    description
  } = body;

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
        description
      }
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
