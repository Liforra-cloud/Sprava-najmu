//app/api/tenants/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

// GET - detail nájemníka
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseRouteClient();
  const { data, error } = await supabase.from("tenants").select("*").eq("id", params.id).single();
  if (error || !data) return NextResponse.json({ error: error?.message || "Nájmeník nenalezen" }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH - editace nájemníka
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseRouteClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("tenants")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - smazání nájemníka
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseRouteClient();
  const { error } = await supabase.from("tenants").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
