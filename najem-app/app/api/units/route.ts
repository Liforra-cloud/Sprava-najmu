// app/api/units/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

const ALLOWED_ORDER_FIELDS = [
  "identifier",
  "monthly_rent",
  "floor",
  "area",
  "occupancy_status"
];

// Typ pro Unit, podle struktury v databázi
type Unit = {
  id: string;
  property_id: string;
  identifier: string;
  floor?: number;
  area?: number;
  description?: string;
  occupancy_status?: string;
  monthly_rent?: number;
  user_id?: string;

};

// Typ pro výsledek joinu tenantů
type TenantInfo = {
  id: string;
  full_name: string;
} | null;

export async function GET(request: Request) {
  const supabase = supabaseRouteClient();

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const stav = searchParams.get("stav");
  const search = searchParams.get("search");
  const floor = searchParams.get("floor");
  const areaMin = searchParams.get("areaMin");
  const areaMax = searchParams.get("areaMax");
  const orderBy = searchParams.get("orderBy") || "date_added";
  const orderDir = searchParams.get("orderDir") === "asc" ? "asc" : "desc";

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json([]);
  }

  try {
    // 1. Základní SELECT jednotek uživatele
    let query = supabase
      .from("units")
      .select("*")
      .eq("user_id", session.user.id);

    if (propertyId) query = query.eq("property_id", propertyId);
    if (stav) query = query.eq("occupancy_status", stav);
    if (search) {
      query = query.or(
        `identifier.ilike.%${search}%,description.ilike.%${search}%`
      );
    }
    if (floor) query = query.eq("floor", floor);
    if (areaMin) query = query.gte("area", Number(areaMin));
    if (areaMax) query = query.lte("area", Number(areaMax));

    // Bezpečné třídění
    if (ALLOWED_ORDER_FIELDS.includes(orderBy)) {
      query = query.order(orderBy, { ascending: orderDir === "asc" });
    } else {
      query = query.order("date_added", { ascending: false });
    }

    const { data: units, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Pro každou jednotku zjisti aktuálního nájemníka z unit_tenants a jeho jméno z tenants
    const unitIds = (units ?? []).map((u: Unit) => u.id);

    const tenantsMap: Record<string, TenantInfo> = {};
    if (unitIds.length > 0) {
      const { data: ut, error: utErr } = await supabase
        .from('unit_tenants')
        .select('unit_id, tenant:tenants (id, full_name)')
        .is('date_to', null)
        .in('unit_id', unitIds);

      if (!utErr && ut) {
        (ut as { unit_id: string; tenant: { id: string; full_name: string } }[]).forEach((rec) => {
          tenantsMap[rec.unit_id] = rec.tenant
            ? { id: rec.tenant.id, full_name: rec.tenant.full_name }
            : null;
        });
      }
    }

    // 3. Spoj výsledek: jednotka + tenant info
    const result = (units ?? []).map((unit: Unit) => ({
      ...unit,
      tenant_id: tenantsMap[unit.id]?.id ?? null,
      tenant_full_name: tenantsMap[unit.id]?.full_name ?? null,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// POST funkce zůstává stejná
export async function POST(request: Request) {
  const supabase = supabaseRouteClient();
  const body = await request.json();

  const identifier = body.identifier || body.unit_number;
  const { property_id, floor, area, description } = body;

  if (!identifier) {
    return NextResponse.json(
      { error: "Chybí unit_number/identifier!" },
      { status: 400 }
    );
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
