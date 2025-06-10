//app/api/tenants/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

// GET - seznam nájemníků
export async function GET() {
  const supabase = supabaseRouteClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("date_registered", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST - přidání nájemníka
export async function POST(request: Request) {
  const supabase = supabaseRouteClient();
  const body = await request.json();
  const { data, error } = await supabase
    .from("tenants")
    .insert([body])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
