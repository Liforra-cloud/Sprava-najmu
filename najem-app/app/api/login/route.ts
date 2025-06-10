// app/api/login/route.ts
import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(request: Request) {
  const supabase = supabaseRouteClient();
  const { email, password } = await request.json();

  // přihlásíme pomocí emailu/hesla
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // vracíme status 401 + message do klienta
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  // data.session obsahuje access_token a refresh_token,
  // auth-helpers-nextjs je automaticky zapíše do cookies
  return NextResponse.json(
    { user: data.user },
    { status: 200 }
  );
}
