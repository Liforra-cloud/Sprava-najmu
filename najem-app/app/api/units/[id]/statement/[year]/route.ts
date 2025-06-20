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

type Lease = {
  id: string;
  tenant_id: string;
  unit_id: string;
  start_date: string;
  end_date: string | null;
  monthly_obligations: MonthlyObligation[];
};

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const { id, year } = params;
  const supabase = supabaseRouteClient();

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

  // Vytvoř pole obligations obohacené o info o lease
  const obligationsWithLease = (data as Lease[]).flatMap((lease) =>
    (lease.monthly_obligations ?? [])
      .filter((ob) => String(ob.year) === String(year))
      .map((ob) => ({
        ...ob,
        lease_start: lease.start_date,
        lease_end: lease.end_date,
        lease_id: lease.id,
        tenant_id: lease.tenant_id,
      }))
  );

  return NextResponse.json(obligationsWithLease);
}
