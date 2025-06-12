// /app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

// GET: Výpis dokumentů podle filtru
export async function GET(request: NextRequest) {
  const supabase = supabaseRouteClient()
  const { searchParams } = new URL(request.url)
  const filters: Record<string, string> = {}
  for (const key of ['property_id', 'unit_id', 'tenant_id', 'expense_id']) {
    if (searchParams.get(key)) filters[key] = searchParams.get(key)!
  }

  let query = supabase.from('documents').select('*').order('uploaded_at', { ascending: false })
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: Upload dokumentu
export async function POST(request: NextRequest) {
  const supabase = supabaseRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  // Zpracuj form-data (multipart)
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const property_id = formData.get('property_id')
  const unit_id = formData.get('unit_id')
  const tenant_id = formData.get('tenant_id')
  const expense_id = formData.get('expense_id')
  const name = formData.get('name') || ''
  const userFileName = file?.name || 'dokument.pdf'
  const date = formData.get('date') || new Date().toISOString().slice(0, 10)

  if (!file) return NextResponse.json({ error: 'Chybí soubor.' }, { status: 400 })
  if (!property_id && !unit_id && !tenant_id && !expense_id) {
    return NextResponse.json({ error: 'Musí být vyplněno property_id, unit_id, tenant_id nebo expense_id.' }, { status: 400 })
  }

  // Bezpečný název souboru do storage (unikátní, bez diakritiky a mezer)
  const ext = userFileName.split('.').pop()?.toLowerCase() || 'pdf'
  const safeBase = Date.now() + '-' + Math.random().toString(36).slice(2)
  const uniqueName = `${safeBase}.${ext}`

  // Uložení do Supabase Storage (bucket "documents")
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(uniqueName, file, { upsert: false, contentType: file.type })

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 })
  }

  // Podepsaný (signed) URL pro soukromý bucket
  const { data: signedUrlData } = await supabase.storage
    .from('documents')
    .createSignedUrl(uniqueName, 60 * 60) // platnost 1 hodina

  const file_url = signedUrlData?.signedUrl || null

  // Uložení do tabulky documents
  const { data, error } = await supabase
    .from('documents')
    .insert([{
      property_id: property_id || null,
      unit_id: unit_id || null,
      tenant_id: tenant_id || null,
      expense_id: expense_id || null,
      name,                        // uživatelský popis (speciální znaky dovoleny)
      file_name: uniqueName,       // název v bucketu (technický)
      original_file_name: userFileName, // originální název (volitelné)
      date,
      file_url,
      user_id: session.user.id,
      uploaded_by: session.user.id
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
