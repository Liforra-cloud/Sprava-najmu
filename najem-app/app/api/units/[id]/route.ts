// app/api/units/[id]/route.ts
// app/api/units/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

// Typ pro nájemníky napojené na jednotku
type UnitTenant = {
  id: string;
  tenant_id: string;
  lease_start: string | null;
  lease_end: string | null;
  note?: string;
  tenant: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  }
}

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

  // 2. Najdi nájemníky této jednotky (JOIN na tenants)
  let tenants: UnitTenant[] = [];
  const { data: unitTenants, error: tenantsError } = await supabase
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

  tenants = unitTenants || [];

  // Výsledek bude: unit + pole tenants
  return NextResponse.json({ ...unit, tenants });
}

// PATCH - Aktualizace jednotky
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = supabaseRouteClient();
  const body = await request.json();

  // TODO: Přidej kontrolu user_id dle potřeby!

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
