// /app/api/documents/route.ts

// /app/api/documents/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

// GET: výpis dokumentů podle entity (unit/property/expense/tenant)
export async function GET(request: NextRequest) {
  const supabase = supabaseRouteClient()
  const { searchParams } = new URL(request.url)
  const property_id = searchParams.get('property_id')
  const unit_id = searchParams.get('unit_id')
  const expense_id = searchParams.get('expense_id')
  const tenant_id = searchParams.get('tenant_id')

  let query = supabase.from('documents').select('*').order('uploaded_at', { ascending: false })
  if (property_id) query = query.eq('property_id', property_id)
  if (unit_id) query = query.eq('unit_id', unit_id)
  if (expense_id) query = query.eq('expense_id', expense_id)
  if (tenant_id) query = query.eq('tenant_id', tenant_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: nahrání dokumentu (už máš funkční)
// NECHÁVÁME BEZE ZMĚNY z tvého posledního postu

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
  const expense_id = formData.get('expense_id')
  const name = formData.get('name') || ''
  const file_name = file?.name || 'dokument.pdf'
  const date = formData.get('date') || new Date().toISOString().slice(0, 10)

  if (!file) {
    return NextResponse.json({ error: 'Chybí soubor.' }, { status: 400 })
  }
  if (!property_id && !unit_id && !expense_id) {
    return NextResponse.json({ error: 'Musí být vyplněno property_id, unit_id nebo expense_id.' }, { status: 400 })
  }

  // Název souboru do storage
  const ext = file.name.split('.').pop() || 'pdf'
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Uložení do Supabase Storage (bucket "documents")
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(uniqueName, file, { upsert: false, contentType: file.type })

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 })
  }

  // URL ke stažení souboru
  const file_url = supabase.storage.from('documents').getPublicUrl(uniqueName).data.publicUrl

  // Uložení do tabulky documents
  const { data, error } = await supabase
    .from('documents')
    .insert([{
      property_id: property_id || null,
      unit_id: unit_id || null,
      expense_id: expense_id || null,
      name,
      file_name,
      date,
      file_url,
      user_id: session.user.id,
      uploaded_by: session.user.id
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE: smaže dokument (pouze pokud patří aktuálnímu uživateli!)
export async function DELETE(request: NextRequest) {
  const supabase = supabaseRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Chybí id dokumentu.' }, { status: 400 })

  // Ověř, že dokument patří uživateli
  const { data: doc, error: fetchErr } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchErr || !doc) return NextResponse.json({ error: 'Dokument nenalezen.' }, { status: 404 })
  if (doc.user_id !== session.user.id && doc.uploaded_by !== session.user.id)
    return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 403 })

  // Smazání ze storage
  const fileName = doc.file_url.split('/').pop()
  if (fileName) {
    await supabase.storage.from('documents').remove([fileName])
  }
  // Smazání z DB
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
