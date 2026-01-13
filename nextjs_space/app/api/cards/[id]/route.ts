import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getSettings() {
  let settings = await prisma.settings.findFirst({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 1, baseCurrency: 'USD', fxRateEurUsd: 1.08, minRoiThreshold: 10, tcgplayerFee: 0.1, cardmarketFee: 0.05, shippingCost: 5 },
    });
  }
  return settings;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params?.id;
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        set: true,
        priceSnapshots: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const settings = await getSettings();
    
    // Calculate PSA opportunities sorted by ROI
    const psaSnapshots = card.priceSnapshots.filter(s => s.source === 'pricetracker' && s.psaGrade);
    const tcgPrice = card.priceSnapshots.find(s => s.source === 'tcgplayer')?.priceMarket ?? 0;
    const cmPrice = card.priceSnapshots.find(s => s.source === 'cardmarket')?.priceMarket ?? 0;
    const basePrice = tcgPrice || (cmPrice * settings.fxRateEurUsd) || 10;

    const psaOpportunities = psaSnapshots.length > 0 
      ? psaSnapshots.map(snap => {
          const buyPrice = (snap.priceMarket ?? 0) * 0.85;
          const sellPrice = (snap.priceMarket ?? 0) * 1.1;
          const profit = sellPrice * (1 - settings.tcgplayerFee) - buyPrice * (1 + settings.tcgplayerFee) - settings.shippingCost;
          const roi = buyPrice > 0 ? (profit / (buyPrice + settings.shippingCost)) * 100 : 0;
          return { grade: snap.psaGrade!, buyPrice, sellPrice, profit, roi };
        })
      : [10, 9, 8, 7, 6].map(grade => {
          const mult: Record<number, number> = { 10: 5, 9: 2.5, 8: 1.5, 7: 1.2, 6: 1 };
          const buyPrice = basePrice * mult[grade] * 0.85;
          const sellPrice = basePrice * mult[grade] * 1.1;
          const profit = sellPrice * (1 - settings.tcgplayerFee) - buyPrice * (1 + settings.tcgplayerFee) - settings.shippingCost;
          const roi = buyPrice > 0 ? (profit / (buyPrice + settings.shippingCost)) * 100 : 0;
          return { grade, buyPrice, sellPrice, profit, roi };
        });

    psaOpportunities.sort((a, b) => b.roi - a.roi);

    return NextResponse.json({ card, psaOpportunities: psaOpportunities.slice(0, 5) });
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
