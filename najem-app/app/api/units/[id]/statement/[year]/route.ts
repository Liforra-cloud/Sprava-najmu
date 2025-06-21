// app/api/units/[id]/statement/[year]/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function GET(
  request: Request,
  { params }: { params: { id: string, year: string } }
) {
  const { id, year } = params;
  const supabase = supabaseRouteClient();

  // Load all monthly_obligations for the selected year and unit
  const { data, error } = await supabase
    .from("leases")
    .select(`
      id,
      start_date,
      end_date,
      tenant:tenants(id, full_name, email),
      monthly_obligations (
        id, year, month, rent, services, water, gas, electricity, repair_fund, custom_charges, total_due, paid_amount, debt
      )
    `)
    .eq("unit_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Gather all obligations for given year
  let obligations: any[] = [];
  data.forEach((lease: any) => {
    obligations = obligations.concat(
      (lease.monthly_obligations || []).filter((m: any) => m.year === Number(year))
    );
  });

  return NextResponse.json({ obligations });
}
