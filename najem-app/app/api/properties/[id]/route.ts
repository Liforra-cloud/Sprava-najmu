// app/api/properties/[id]/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const propertyId = params.id;

  // Debug: vypiš, jaké id přichází z URL
  console.log('Hledám property s id:', JSON.stringify(propertyId));

  // Debug: vypiš všechny id v databázi
  const all = await supabase.from('properties').select('id');
  console.log('Všechna id v DB:', all.data);

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Nemovitost nebyla nalezena (ani přes přímé porovnání).', debug: { error, propertyId, allIds: all.data } },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
