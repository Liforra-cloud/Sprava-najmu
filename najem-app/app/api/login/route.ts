// app/api/login/route.ts
import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(request: Request) {
  let email = "";
  let password = "";

  try {
    const data = await request.json();
    email = data.email;
    password = data.password;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON. Přihlášení selhalo." },
      { status: 400 }
    );
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Zadejte e-mail a heslo." },
      { status: 400 }
    );
  }

  const supabase = supabaseRouteClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ user: data.user }, { status: 200 });
}
