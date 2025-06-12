/app/api/documents/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRouteClient } from '@/lib/supabaseRouteClient'
import { randomUUID } from 'crypto'

export const runtime = 'edge' // Volitelně: rychlejší upload

export async function POST(request: NextRequest) {
  const supabase = supabaseRouteClient()
  const formData = await request.formData()

  const file = formData.get('file') as File
  const description = formData.get('description') as string || ''
  const property_id = formData.get('property_id') as string || null
  const unit_id = formData.get('unit_id') as string || null
  const tenant_id = formData.get('tenant_id') as string || null

  // Session uživatele (přihlášení)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  if (!file) {
    return NextResponse.json({ error: 'Soubor je povinný.' }, { status: 400 })
  }

  // Uložíme do storage/bucketu
  const ext = file.name.split('.').pop()
  const fileName = `${randomUUID()}.${ext}`

  // Upload do bucketu 'documents'
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const file_url = uploadData?.path ? `documents/${fileName}` : ''
  const { data, error } = await supabase
    .from('documents')
    .insert([{
      file_name: file.name,
      file_url,
      description,
      uploaded_by: session.user.id,
      property_id,
      unit_id,
      tenant_id,
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
