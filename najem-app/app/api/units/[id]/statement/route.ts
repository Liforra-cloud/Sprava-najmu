// api/units/[id]/statement/route.ts

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

type Params = { id: string };

export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = params;
  const supabase = supabaseRouteClient();

  // Načti query params: from, to
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from"); // např. 2024-01
  const to = searchParams.get("to");     // např. 2024-12

  // Ověř formát
  if (!from || !to) {
    return NextResponse.json({ error: "Chybí období (from/to)" }, { status: 400 });
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
    .eq("unit_id", id);

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

