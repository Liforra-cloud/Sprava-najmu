//app/api/documents/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  // Zjisti název souboru v bucketu a smaž z úložiště
  const { data: doc, error: getError } = await supabase
    .from('documents')
    .select('file_name')
    .eq('id', params.id)
    .single()
  if (getError) {
    return NextResponse.json({ error: getError.message }, { status: 500 })
  }

  if (doc?.file_name) {
    await supabase.storage.from('documents').remove([doc.file_name])
  }

  // Smaž záznam z tabulky
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

  return NextResponse.json({ success: true })
}
