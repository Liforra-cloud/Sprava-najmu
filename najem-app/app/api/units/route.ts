// app/api/units/route.ts

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServerClient";

export async function POST(request: Request) {
  // Parse body
  const { property_id, identifier } = await request.json();

  // Basic validation
  if (!property_id || !identifier) {
    return NextResponse.json(
      { error: "Chybí property_id nebo označení jednotky." },
      { status: 400 }
    );
  }

  // Insert new unit using service-role key (server-only client)
  const { data, error } = await supabaseServer
    .from("units")
    .insert({ property_id, identifier })
    .select()
    .single();

  if (error) {
    console.error("Chyba při vkládání jednotky:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Return created record
  return NextResponse.json(data, { status: 201 });
}
