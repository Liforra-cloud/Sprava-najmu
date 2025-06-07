// app/api/properties/route.ts
/**
 * Ensure Prisma client is generated before build:
 * Add "postinstall": "prisma generate" in package.json
 */
// @ts-ignore: Prisma client may need generation
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // @ts-ignore
  const properties = await prisma.property.findMany({ include: { units: true } });
  return NextResponse.json(properties);
}

export async function POST(request: Request) {
  const { name, address } = await request.json();
  // @ts-ignore
  const newProp = await prisma.property.create({ data: { name, address } });
  return NextResponse.json(newProp, { status: 201 });
}
