// app/api/units/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

// GET - Detail jednotky podle ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = supabaseRouteClient();

  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Jednotka nenalezena" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH - Aktualizace jednotky
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = supabaseRouteClient();
  const body = await request.json();

  // Můžeš zde případně přidat kontrolu user_id!

  const { data, error } = await supabase
    .from("units")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE - Smazání jednotky
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = supabaseRouteClient();
  const { error } = await supabase
    .from("units")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
