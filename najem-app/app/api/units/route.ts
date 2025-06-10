// app/api/units/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// fallback na NEXT_PUBLIC, kdyby SUPABASE_URL nebylo definované
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  const { property_id, identifier } = await request.json();
  if (!property_id || !identifier) {
    return NextResponse.json(
      { error: "Chybí property_id nebo označení jednotky." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("units")
    .insert({ property_id, identifier })
    .select()
    .single();

  if (error) {
    console.error("Chyba při vkládání jednotky:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
