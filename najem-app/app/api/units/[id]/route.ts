// app/api/units/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

// GET - Detail jednotky + nájmy + obligations + platby
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = supabaseRouteClient();

  // Načti jednotku
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

  // Načti smlouvy k jednotce + nájemníky + monthly obligations + platby
  const { data: leases, error: leasesError } = await supabase
    .from("leases")
    .select(
      `
        id,
        tenant_id,
        unit_id,
        start_date,
        end_date,
        rent_amount,
        monthly_services,
        deposit,
        name,
        tenant:tenants (
          id,
          full_name,
          email,
          phone
        ),
        monthly_obligations (
          id,
          year,
          month,
          total_due,
          paid_amount,
          debt,
          rent,
          services,
          water,
          gas,
          electricity
        ),
        payments (
          id,
          amount,
          payment_date
        )
      `
    )
    .eq("unit_id", id)
    .order("start_date", { ascending: false });

  if (leasesError) {
    return NextResponse.json(
      { error: leasesError.message },
      { status: 500 }
    );
  }

  // Rozdělení na aktivní a historické nájmy podle dnešního data
  const today = new Date().toISOString().split("T")[0];

  const activeLeases = leases.filter((lease) =>
    lease.start_date <= today && (!lease.end_date || lease.end_date >= today)
  );

  const pastLeases = leases.filter((lease) =>
    lease.end_date && lease.end_date < today
  );

  return NextResponse.json({
    ...unit,
    activeLeases,
    pastLeases,
  });
}

// PATCH - Aktualizace jednotky
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

// DELETE - Smazání jednotky
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

