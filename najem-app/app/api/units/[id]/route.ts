// app/api/units/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

// Detail jednotky včetně nájemníků (pokud tabulka unit_tenants existuje)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = supabaseRouteClient();

  // 1. Zjisti session uživatele
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ error: "Nepřihlášený uživatel" }, { status: 401 });
  }

  // 2. Načti jednotku, která patří přihlášenému uživateli (přes vlastnictví nemovitosti)
  // Je třeba join přes properties kvůli user_id
  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select(
      `
      *,
      property:properties!units_property_id_fkey (
        id,
        user_id
      )
      `
    )
    .eq("id", id)
    .single();

  if (unitError || !unit) {
    return NextResponse.json(
      { error: unitError?.message || "Jednotka nenalezena" },
      { status: 404 }
    );
  }

  // Ověř vlastnictví
  if (!unit.property || unit.property.user_id !== session.user.id) {
    return NextResponse.json({ error: "Nedostatečná oprávnění" }, { status: 403 });
  }

  // 3. Načti nájemníky (pokud máš joinovací tabulku)
  let tenants = [];
  try {
    const { data: unitTenants, error: utError } = await supabase
      .from("unit_tenants")
      .select(
        `
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
        `
      )
      .eq("unit_id", id);

    if (utError) {
      // Pokud tabulka neexistuje, přeskoč, jinak vrať error
      if (utError.message && utError.message.includes("does not exist")) {
        tenants = [];
      } else {
        return NextResponse.json({ error: utError.message }, { status: 500 });
      }
    } else {
      tenants = unitTenants ?? [];
    }
  } catch {
    tenants = [];
  }

  // Sestav odpověď bez informace o property (je zbytečné posílat user_id zpět)
  const { property, ...unitData } = unit;
  return NextResponse.json({ ...unitData, tenants });
}
