// app/api/units/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    description
  } = body;

  // 1. Ověř, že property_id existuje!
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', property_id)
    .single();

  if (!property || propertyError) {
    return NextResponse.json(
      { error: 'Nemovitost nebyla nalezena. Nejprve založ nemovitost, ke které chceš jednotku přiřadit.' },
      { status: 400 }
    );
  }

  // 2. Uložení jednotky pokračuje až po kontrole property_id
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
      }
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
