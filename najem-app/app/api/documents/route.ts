// /app/api/documents/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'

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
  const name = formData.get('name') || ''           // popisek uživatele (volitelné)
  const file_name = file?.name || 'dokument.pdf'     // <-- NÁZEV SOUBORU!
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
      name,           // popis, nepovinný
      file_name,      // NÁZEV SOUBORU, povinný
      date,
      file_url,
      user_id: session.user.id,    // pokud potřebuješ oba, nech oba
    uploaded_by: session.user.id // <-- TOTO JE NOVÉ!
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
