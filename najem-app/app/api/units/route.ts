// app/api/units/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Na serveru bys měl používat service role key, ale pro rychlé testování lze použít i 
// NEXT_PUBLIC klíč, pokud je v .env
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  
);

export async function POST(request: Request) {
  const { property_id, identifier } = await request.json();

  if (!property_id || !identifier) {
    return NextResponse.json(
      { error: 'Chybí property_id nebo označení jednotky.' },
      { status: 400 }
    );
  }

  // Vložení nové jednotky do tabulky "units"
  const { data, error } = await supabase
    .from('units')
    .insert({ property_id, identifier })
    .select()
    .single();

  if (error) {
    console.error('Chyba při vkládání jednotky:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Vrátíme vložený záznam
  return NextResponse.json(data, { status: 201 });
}
