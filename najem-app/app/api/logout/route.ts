// app/api/logout/route.ts

import { NextResponse } from 'next/server';
import { supabaseRouteClient } from '@/lib/supabaseRouteClient';

export async function POST() {
  try {
    const supabase = supabaseRouteClient();
    await supabase.auth.signOut();
    // Nutné použít absolutní URL!
    return NextResponse.redirect('https://sprava-najmu.vercel.app/login', { status: 302 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
