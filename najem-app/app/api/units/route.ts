import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function GET() {
  const supabase = supabaseRouteClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Pokud není přihlášený uživatel, vrať prázdné pole
    return NextResponse.json([]);
  }

  // Získáme pouze jednotky aktuálního uživatele
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("user_id", session.user.id)
    .order("date_added", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST funkce už je správně (ponech jak máš)
export async function POST(request: Request) {
  const supabase = supabaseRouteClient();
  const body = await request.json();

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
      identifier,
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
