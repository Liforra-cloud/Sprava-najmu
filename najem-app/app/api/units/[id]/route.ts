// app/api/units/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const supabase = supabaseRouteClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { data, error } = await supabase
    .from("units")
    .select(`
      id,
      identifier AS unit_number,
      floor,
      area,
      description,
      property_id
    `)
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request, { params }: Params) {
  const supabase = supabaseRouteClient();
  const body = await request.json();
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
    .update({
      property_id,
      identifier: unit_number,
      floor,
      area,
      description,
      user_id: userId,
    })
    .eq("id", params.id)
    .select();

  if (error) {
    console.error("Chyba při aktualizaci jednotky:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}

export async function DELETE(_request: Request, { params }: Params) {
  const supabase = supabaseRouteClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("units")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Chyba při mazání jednotky:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
