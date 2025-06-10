//app/api/tenants/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

// GET - seznam všech nájemníků
export async function GET() {
  const supabase = supabaseRouteClient();
  const { data, error } = await supabase.from("tenants").select("*").order("full_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST - vytvoření nového nájemníka
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = supabaseRouteClient();

  const { data, error } = await supabase
    .from("tenants")
    .insert([body])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

