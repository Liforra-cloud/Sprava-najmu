// najem-app/app/api/leases/[id]/route.ts

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const lease = await prisma.lease.update({
      where: { id: params.id },
      data: {
        name: body.name,
        unit_id: body.unit_id,
        tenant_id: body.tenant_id,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : null,
        due_day: body.due_day ? parseInt(body.due_day) : 1,
        rent_amount: Number(body.rent_amount ?? 0),
        monthly_water: Number(body.monthly_water ?? 0),
        monthly_gas: Number(body.monthly_gas ?? 0),
        monthly_electricity: Number(body.monthly_electricity ?? 0),
        monthly_services: Number(body.monthly_services ?? 0),
        repair_fund: Number(body.repair_fund ?? 0),
        custom_fields: body.custom_fields as InputJsonValue,
        custom_charges: body.custom_charges as InputJsonValue,
        charge_flags: body.charge_flags as InputJsonValue,
      },
    })

    // ⚠️ Zde aktualizujeme všechny závazky podle nových dat
    await prisma.monthlyObligation.updateMany({
      where: { lease_id: lease.id },
      data: {
        charge_flags: lease.charge_flags,
        custom_charges: lease.custom_charges,
      },
    })

    return NextResponse.json({ success: true, lease })
  } catch (error) {
    console.error('API error saving lease:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chyba při ukládání smlouvy' },
      { status: 500 }
    )
  }
}

