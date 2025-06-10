import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(request: Request) {
  const supabase = supabaseRouteClient();
  const body = await request.json();

  // Debug: vypíšeme si, co fakticky přichází z formuláře
  console.log("POSTED BODY", body);

  // Očekáváme, že frontend pošle unit_number!
  const { property_id, unit_number, floor, area, description } = body;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { data, error } = await supabase
    .from("units")
    .insert({
      property_id,
      identifier: unit_number, // ← toto je KLÍČOVÉ!
      floor,
      area,
      description,
      user_id: userId,
    })
    .select();

  if (error) {
    console.error("Chyba při vkládání jednotky:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}
