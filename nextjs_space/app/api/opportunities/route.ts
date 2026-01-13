import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Rota dinâmica porque usa searchParams
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request?.nextUrl?.searchParams;
    const minRoi = parseFloat(searchParams?.get('minRoi') ?? '0');
    const sortBy = searchParams?.get('sortBy') ?? 'opportunityScore';
    const sortOrder = searchParams?.get('sortOrder') ?? 'desc';
    const limit = parseInt(searchParams?.get('limit') ?? '20');

    // Buscar do cache pré-calculado
    const cached = await prisma.opportunityCache.findMany({
      where: { roi: { gte: minRoi } },
      orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
      take: Math.min(limit, 100),
    });

    // Buscar settings para retornar junto
    let settings = await prisma.settings.findFirst({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 1, baseCurrency: 'USD', fxRateEurUsd: 1.08, minRoiThreshold: 10, tcgplayerFee: 0.1, cardmarketFee: 0.05, shippingCost: 5 },
      });
    }

    // Mapear para formato esperado pelo frontend
    const opportunities = cached.map(opp => ({
      cardId: opp.cardId,
      cardName: opp.cardName,
      setName: opp.setName,
      rarity: opp.rarity,
      imageSmall: opp.imageSmall,
      psaGrade: opp.psaGrade,
      buyPrice: opp.buyPrice,
      buySource: opp.buySource,
      buyCurrency: opp.buyCurrency,
      sellPrice: opp.sellPrice,
      sellSource: opp.sellSource,
      sellCurrency: opp.sellCurrency,
      spread: opp.spread,
      netProfit: opp.netProfit,
      roi: opp.roi,
      fxRate: opp.fxRate,
      momentum: opp.momentum,
      opportunityScore: opp.opportunityScore,
      liquidity: opp.liquidity,
    }));

    // Adicionar info de quando o cache foi atualizado
    const cacheInfo = cached[0]?.calculatedAt ?? null;

    const response = NextResponse.json({ 
      opportunities, 
      settings,
      cacheUpdatedAt: cacheInfo,
      fromCache: true
    });
    
    // Cache no browser por 2 min, CDN por 5 min
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=120');
    return response;
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ opportunities: [], fromCache: false }, { status: 500 });
  }
}
