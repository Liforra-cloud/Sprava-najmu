import { NextRequest, NextResponse } from 'next/server';
import { supabaseRouteClient } from '@/lib/supabaseRouteClient';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;
  const supabase = supabaseRouteClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Session cookies helper nastaví automaticky!
  return NextResponse.json({ user: data.user });
}
