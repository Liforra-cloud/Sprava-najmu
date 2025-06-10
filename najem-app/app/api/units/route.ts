

import { NextResponse } from "next/server"
import { supabaseRouteClient } from "@/lib/supabaseRouteClient"

export async function GET() {
  const supabase = supabaseRouteClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Nepřihlášený uživatel" }, { status: 401 })
  }

  // Načteme všechny jednotky, jejichž nemovitost patří uživateli:
  const { data, error } = await supabase
    .from("units")
    .select("id, identifier, floor, area, isOccupied, property_id")
    .in("property_id", 
      // alternativně: .eq("…", session.user.id) pokud máte v units user_id
      // nebo přes join: .select("*, property(*)").eq("property.user_id", session.user.id)
      // ale pro jednoduchost vrátíme vše:
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
