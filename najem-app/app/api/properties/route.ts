// app/api/properties/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('properties')
    .select('*');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { name, address, description, unit } = await request.json();

  // 1) vytvoříme nemovitost
  const { data: prop, error: propError } = await supabase
    .from('properties')
    .insert([{ name, address, description }])
    .select()
    .single();
  if (propError) {
    return NextResponse.json({ error: propError.message }, { status: 500 });
  }

  // 2) vytvoříme jednotku k této nemovitosti
  const { data: unitData, error: unitError } = await supabase
    .from('units')
    .insert([{
      property_id: prop.id,
      identifier: unit.identifier,
      floor: unit.floor,
      disposition: unit.disposition,
      area: unit.area,
      occupancy_status: 'volné',
      monthly_rent: unit.monthly_rent
    }])
    .select()
    .single();
  if (unitError) {
    return NextResponse.json({ error: unitError.message }, { status: 500 });
  }

  return NextResponse.json({ property: prop, unit: unitData }, { status: 201 });
}
