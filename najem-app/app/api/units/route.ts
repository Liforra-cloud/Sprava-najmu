// app/api/units/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ZDE použij vykřičníky, aby build nehlásil chybu
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();
  const {
    property_id,
    identifier,
    floor,
    disposition,
    area,
    occupancy_status,
    monthly_rent,
    deposit,
    description,
  } = body;

  // DEBUG: Vypiš property_id, co přijde z frontend
  console.log('property_id z requestu:', JSON.stringify(property_id));

  // DEBUG: Vypiš všechna id z tabulky properties
  const allProperties = await supabase.from('properties').select('id');
  console.log('Všechna id v DB:', allProperties.data);

  // Kontrola existence property_id v tabulce properties
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', property_id)
    .single();

  // DEBUG: Vypiš property a případný error
  console.log('Výsledek hledání property:', property, propertyError);

  if (propertyError || !property) {
    return NextResponse.json(
      {
        error: 'Nemovitost nebyla nalezena (ani přes přímé porovnání).',
        debug: { property_id, allProperties: allProperties.data, propertyError },
      },
      { status: 404 }
    );
  }

  // Uložení nové jednotky (unit)
  const { data, error } = await supabase
    .from('units')
    .insert([
      {
        property_id,
        identifier,
        floor,
        disposition,
        area,
        occupancy_status,
        monthly_rent,
        deposit,
        description,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Chyba při ukládání jednotky.', debug: error },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
