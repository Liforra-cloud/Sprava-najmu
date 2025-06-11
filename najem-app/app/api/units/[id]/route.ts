// app/api/units/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

// GET - Detail jednotky podle ID + nájemníci
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = supabaseRouteClient();

  // 1. Základní data jednotky
  const { data: unit, error } = await supabase
    .from("units")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !unit) {
    return NextResponse.json({ error: error?.message || "Jednotka nenalezena" }, { status: 404 });
  }

  // 2. Najdi nájemníky této jednotky
  const { data: tenants, error: tenantsError } = await supabase
    .from("unit_tenants")
    .select(`
      id,
      tenant_id,
      lease_start,
      lease_end,
      note,
      tenant:tenants (
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq("unit_id", id);

  if (tenantsError) {
    return NextResponse.json({ error: tenantsError.message }, { status: 500 });
  }

  // Výsledek bude: unit + pole tenants
  return NextResponse.json({ ...unit, tenants: tenants ?? [] });
}
