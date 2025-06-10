// lib/supabaseRouteClient.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export function supabaseRouteClient() {
  return createRouteHandlerClient({ cookies });
}
