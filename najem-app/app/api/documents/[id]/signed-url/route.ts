import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // <- používáme service role key
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Načti dokument z tabulky 'documents'
    const { data, error } = await supabase
      .from('documents')
      .select('file_name, mime_type')
      .eq('id', params.id)
      .single()

    if (error || !data?.file_name) {
      console.error('DB error:', error)
      return NextResponse.json({ error: error?.message ?? 'Dokument nenalezen' }, { status: 404 })
    }

    // 2. Vygeneruj podepsanou URL pro soubor z bucketu 'documents'
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(data.file_name, 60 * 60)

    if (urlError || !urlData?.signedUrl) {
      console.error('Storage error:', urlError)
      return NextResponse.json({ error: urlError?.message ?? 'Chyba při získání URL' }, { status: 500 })
    }

    return NextResponse.json({
      url: urlData.signedUrl,
      mimeType: data.mime_type,
      fileName: data.file_name,
    })

  } catch (err) {
    console.error('API route crash:', err)
    return NextResponse.json({ error: 'Neznámá chyba', detail: String(err) }, { status: 500 })
  }
}
