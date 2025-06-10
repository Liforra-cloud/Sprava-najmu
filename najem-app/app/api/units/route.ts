import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(request: Request) {
  const supabase = supabaseRouteClient();
  const body = await request.json();

  // Tohle vezme identifier, nebo unit_number, podle toho, co přijde
  const identifier = body.identifier || body.unit_number;
  const { property_id, floor, area, description } = body;

  if (!identifier) {
    return NextResponse.json({ error: "Chybí unit_number/identifier!" }, { status: 400 });
  }

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
      identifier, // ZDE JE JISTOTA, že nikdy není null!
      floor,
      area,
      description,
      user_id: userId,
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}
