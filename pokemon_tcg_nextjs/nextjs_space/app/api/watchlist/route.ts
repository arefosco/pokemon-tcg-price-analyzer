import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const watchlist = await prisma.watchlist.findMany({
      include: {
        card: {
          include: {
            set: true,
            priceSnapshots: { take: 2, orderBy: { timestamp: 'desc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = watchlist.map((w) => {
      const tcg = w.card.priceSnapshots.find((p) => p.source === 'tcgplayer');
      const cm = w.card.priceSnapshots.find((p) => p.source === 'cardmarket');
      const tcgPrice = tcg?.priceMarket ?? 0;
      const cmPrice = (cm?.priceMarket ?? 0) * 1.08;
      const buyPrice = Math.min(tcgPrice || Infinity, cmPrice || Infinity);
      const sellPrice = Math.max(tcgPrice, cmPrice);
      const roi = buyPrice > 0 && buyPrice !== Infinity ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

      return {
        id: w.id,
        cardId: w.cardId,
        cardName: w.card.name,
        setName: w.card.set?.name ?? '',
        rarity: w.card.rarity,
        imageSmall: w.card.imageSmall,
        tcgPrice,
        cmPrice: cm?.priceMarket ?? 0,
        roi: Math.round(roi * 100) / 100,
        notes: w.notes,
        createdAt: w.createdAt,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Watchlist GET error:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cardId, notes } = await request.json();
    if (!cardId) {
      return NextResponse.json({ error: 'cardId required' }, { status: 400 });
    }

    const existing = await prisma.watchlist.findUnique({ where: { cardId } });
    if (existing) {
      return NextResponse.json({ error: 'Already in watchlist' }, { status: 409 });
    }

    const item = await prisma.watchlist.create({
      data: { cardId, notes },
    });

    return NextResponse.json({ item, success: true });
  } catch (error) {
    console.error('Watchlist POST error:', error);
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { cardId } = await request.json();
    if (!cardId) {
      return NextResponse.json({ error: 'cardId required' }, { status: 400 });
    }

    await prisma.watchlist.delete({ where: { cardId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Watchlist DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove' }, { status: 500 });
  }
}
