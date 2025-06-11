// app/api/units/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

type Tenant = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
};

type UnitTenant = {
  id: string;
  tenant_id: string;
  lease_start: string | null;
  lease_end: string | null;
  note?: string;
  tenant: Tenant | null;
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = supabaseRouteClient();

  // Základní data jednotky
  const { data: unit, error } = await supabase
    .from("units")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !unit) {
    return NextResponse.json({ error: error?.message || "Jednotka nenalezena" }, { status: 404 });
  }

  // Najdi nájemníky této jednotky (JOIN na tenants)
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

  // POZOR! tenant je pole – vždy vezmeme první prvek
  const tenants: UnitTenant[] = (unitTenants || []).map((ut: any) => ({
    id: ut.id,
    tenant_id: ut.tenant_id,
    lease_start: ut.lease_start,
    lease_end: ut.lease_end,
    note: ut.note,
    tenant: Array.isArray(ut.tenant) && ut.tenant.length > 0 ? ut.tenant[0] : null
  }));

  return NextResponse.json({ ...unit, tenants });
}

// PATCH a DELETE neměním, jsou správně (dle předchozí odpovědi)
