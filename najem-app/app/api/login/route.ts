import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;
  const supabase = supabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Session cookies už helper nastaví automaticky přes supabaseServerClient
  return NextResponse.json({ user: data.user });
}
