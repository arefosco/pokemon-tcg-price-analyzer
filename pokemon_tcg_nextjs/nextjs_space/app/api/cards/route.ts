import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request?.nextUrl?.searchParams;
    const setId = searchParams?.get('setId') ?? undefined;
    const rarity = searchParams?.get('rarity') ?? undefined;
    const search = searchParams?.get('search') ?? undefined;
    const page = parseInt(searchParams?.get('page') ?? '1', 10);
    const limit = parseInt(searchParams?.get('limit') ?? '50', 10);

    const where: Record<string, unknown> = {};
    if (setId) where.setId = setId;
    if (rarity) where.rarity = rarity;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        include: { set: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.card.count({ where }),
    ]);

    return NextResponse.json({
      cards: cards ?? [],
      total: total ?? 0,
      page,
      totalPages: Math.ceil((total ?? 0) / limit),
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ cards: [], total: 0, page: 1, totalPages: 0 }, { status: 500 });
  }
}
