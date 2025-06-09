//app/api/logout/route.ts

import { NextResponse } from 'next/server';
import { supabaseRouteClient } from '@/lib/supabaseRouteClient';

export async function POST() {
  const supabase = supabaseRouteClient();
  await supabase.auth.signOut();
  // Smaže session cookie a přesměruje na login
  return NextResponse.redirect('/login', { status: 302 });
}
