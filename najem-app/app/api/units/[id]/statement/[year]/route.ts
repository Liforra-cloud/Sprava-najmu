// app/api/units/[id]/statement/[year]/route.ts


import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

type Params = { id: string; year: string };

type CustomCharge = {
  name: string;
  amount: number;
  billable?: boolean;
  enabled?: boolean;
};

type MonthlyObligation = {
  id: string;
  lease_id: string;
  year: number;
  month: number;
  rent: number;
  water: number;
  gas: number;
  electricity: number;
  services: number;
  repair_fund: number;
  total_due: number;
  paid_amount: number;
  debt: number;
  note?: string;
  custom_charges?: CustomCharge[] | string;
  charge_flags?: Record<string, boolean>;
};

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const { id, year } = params;
  const supabase = supabaseRouteClient();

  // Fetch monthly obligations for the unit in the given year
  const { data, error } = await supabase
    .from("leases")
    .select(
      `
        id,
        tenant_id,
        unit_id,
        start_date,
        end_date,
        monthly_obligations (
          id,
          lease_id,
          year,
          month,
          rent,
          water,
          gas,
          electricity,
          services,
          repair_fund,
          total_due,
          paid_amount,
          debt,
          note,
          custom_charges,
          charge_flags
        )
      `
    )
    .eq("unit_id", id);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Data not found" },
      { status: 404 }
    );
  }

  // Flatten and filter obligations by year
  const obligations: MonthlyObligation[] = (data ?? [])
    .flatMap((lease: any) => lease.monthly_obligations ?? [])
    .filter((ob: MonthlyObligation) => String(ob.year) === String(year));

  return NextResponse.json(obligations);
}
