app/api/properties/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const properties = await prisma.property.findMany({ include: { units: true } });
  return NextResponse.json(properties);
}

export async function POST(request: Request) {
  const { name, address } = await request.json();
  const newProp = await prisma.property.create({ data: { name, address } });
  return NextResponse.json(newProp, { status: 201 });
}
