// app/api/statements/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

// Převzaté typy, můžeš použít své

type CustomCharge = { name: string; amount: number; billable?: boolean; enabled?: boolean };
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

export async function GET(request: Request) {
  const supabase = supabaseRouteClient();

  // query params: unit_id, from, to
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get("unit_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!unitId || !from || !to) {
    return NextResponse.json({ error: "Chybí parametry unit_id, from, to" }, { status: 400 });
  }

  // Parsuj year/month
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);

  // SELECT leases/unit + navázané obligations
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
    .eq("unit_id", unitId);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Data not found" }, { status: 404 });
  }

  // Vracíme obligations z leases, které spadají do období from-to
  const obligationsWithLease = (data as Lease[]).flatMap((lease) =>
    (lease.monthly_obligations ?? [])
      .filter((ob) => {
        const obDate = ob.year * 100 + ob.month; // YYYYMM
        const fromDate = fromYear * 100 + fromMonth;
        const toDate = toYear * 100 + toMonth;
        return obDate >= fromDate && obDate <= toDate;
      })
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
