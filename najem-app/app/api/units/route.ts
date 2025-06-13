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

    // Ošetření, aby šlo třídit jen podle povolených sloupců (kvůli bezpečnosti)
    if (ALLOWED_ORDER_FIELDS.includes(orderBy)) {
      query = query.order(orderBy, { ascending: orderDir === "asc" });
    } else {
      query = query.order("date_added", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
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
