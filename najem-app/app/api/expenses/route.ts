export async function POST(request: NextRequest) {
  const supabase = supabaseRouteClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Nepřihlášený uživatel' }, { status: 401 })
  }

  const body = await request.json()
  let { property_id } = body;
  const {
    unit_id = null,
    amount,
    description,
    expense_type = null,
    date_incurred = new Date().toISOString().slice(0, 10)
  } = body;

  // Umožní zadat buď property_id, nebo unit_id (musí být alespoň jedno)
  if ((!property_id && !unit_id) || !amount || !description) {
    return NextResponse.json({ error: 'Chybí povinné pole.' }, { status: 400 })
  }

  // Pokud není property_id, ale máme unit_id, načteme property_id z jednotky
  if (!property_id && unit_id) {
    const { data: unit, error: unitErr } = await supabase
      .from('units')
      .select('property_id')
      .eq('id', unit_id)
      .maybeSingle()
    if (unitErr || !unit?.property_id) {
      return NextResponse.json({ error: 'Nelze zjistit nemovitost pro tuto jednotku.' }, { status: 400 })
    }
    property_id = unit.property_id
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        property_id,
        unit_id,
        amount,
        description,
        expense_type,
        date_incurred,
        user_id: session.user.id
      }
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
