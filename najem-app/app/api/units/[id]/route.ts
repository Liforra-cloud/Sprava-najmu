// app/api/units/[id]/route.ts



import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

// Definice typů
type Tenant = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
};

type UnitTenantDb = {
  id: string;
  tenant_id: string;
  date_from: string | null;
  date_to: string | null;
  note?: string | null;
  tenant: Tenant[]; // Supabase vrací vždy pole!
};

type UnitTenant = {
  id: string;
  tenant_id: string;
  date_from: string | null;
  date_to: string | null;
  note?: string | null;
  tenant: Tenant | null; // My chceme objekt nebo null
};

// GET - Detail jednotky + nájemníci
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = supabaseRouteClient();

  // Základní data jednotky
  const { data: unit, error } = await supabase
    .from("units")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !unit) {
    return NextResponse.json(
      { error: error?.message || "Jednotka nenalezena" },
      { status: 404 }
    );
  }

  // Najdi nájemníky této jednotky (JOIN na tenants)
  const { data: unitTenants, error: tenantsError } = await supabase
    .from("unit_tenants")
    .select(
      `
      id,
      tenant_id,
     date_from,
      date_to,
      note,
      tenant:tenants (
        id,
        full_name,
        email,
        phone
      )
    `
    )
    .eq("unit_id", id);

  if (tenantsError) {
    return NextResponse.json({ error: tenantsError.message }, { status: 500 });
  }

  // Přetypování každé položky, tenant je objekt nebo null (nikdy pole)
  const tenants: UnitTenant[] = (unitTenants as UnitTenantDb[] || []).map(
    (ut) => ({
      id: ut.id,
      tenant_id: ut.tenant_id,
      date_from: ut.date_from,
      date_to: ut.date_to,
      note: ut.note,
      tenant:
        Array.isArray(ut.tenant) && ut.tenant.length > 0 ? ut.tenant[0] : null,
    })
  );

  return NextResponse.json({ ...unit, tenants });
}

// PATCH - Aktualizace jednotky (beze změny)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = supabaseRouteClient();
  const body = await request.json();

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

// DELETE - Smazání jednotky (beze změny)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = supabaseRouteClient();
  const { error } = await supabase.from("units").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
