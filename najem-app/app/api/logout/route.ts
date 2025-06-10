// app/api/logout/route.ts
import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST() {
  const supabase = supabaseRouteClient();
  await supabase.auth.signOut();
  // smaže cookie
  return NextResponse.json({ success: true });
}
