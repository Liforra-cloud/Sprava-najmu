// /app/api/documents/[id]/signed-url/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseRouteClient()

  // 1. Najdi jméno souboru v databázi podle ID dokumentu
  const { data, error } = await supabase
    .from('documents')
    .select('file_name, mime_type')
    .eq('id', params.id)
    .single()

  // Debug: logni načtená data
  console.log('signed-url req', {
    id: params.id,
    file_name: data?.file_name,
    error,
  });

  if (error || !data?.file_name) {
    return NextResponse.json({ error: error?.message ?? 'Dokument nenalezen' }, { status: 404 })
  }

  // 2. Získej signed URL na soukromý soubor (platnost např. 1 hodinu)
  const { data: urlData, error: urlError } = await supabase.storage
    .from('documents')
    .createSignedUrl(data.file_name, 60 * 60) // 1 hodina

  // Debug: logni odpověď od storage
  console.log('signed-url storage', {
    file_name: data.file_name,
    urlData,
    urlError,
  });

  if (urlError || !urlData?.signedUrl) {
    return NextResponse.json({ error: urlError?.message ?? 'Chyba při získání URL' }, { status: 500 })
  }

  // 3. Vrať výsledek
  return NextResponse.json({
    url: urlData.signedUrl,
    mimeType: data.mime_type,
    fileName: data.file_name,
  })
}
