import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos

function calculateMomentum(snapshots: Array<{ priceMarket: number | null; timestamp: Date }>) {
  if (snapshots.length < 2) return 0;
  const sorted = [...snapshots].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const latest = sorted[0]?.priceMarket ?? 0;
  const oldest = sorted[sorted.length - 1]?.priceMarket ?? 0;
  if (oldest === 0 || latest === 0) return 0;
  return ((latest - oldest) / oldest) * 100;
}

function calculateOpportunityScore(roi: number, netProfit: number, momentum: number, spread: number) {
  const roiScore = Math.min(Math.max(roi, 0), 100);
  const profitScore = Math.min(Math.max(netProfit * 2, 0), 100);
  const momentumScore = Math.min(Math.max(momentum + 50, 0), 100);
  const spreadScore = Math.min(Math.max(spread * 2, 0), 100);
  const score = roiScore * 0.35 + profitScore * 0.25 + momentumScore * 0.20 + spreadScore * 0.20;
  return Math.min(Math.max(score, 0), 100);
}

function calculateLiquidity(snapshotCount: number, priceVariance: number) {
  const activityScore = Math.min(snapshotCount * 10, 50);
  const stabilityScore = Math.max(50 - priceVariance * 2, 0);
  return Math.min(activityScore + stabilityScore, 100);
}

export async function POST() {
  try {
    console.log('[OpportunityCache] Iniciando recálculo...');
    
    // Buscar configurações
    let settings = await prisma.settings.findFirst({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 1, baseCurrency: 'USD', fxRateEurUsd: 1.08, minRoiThreshold: 10, tcgplayerFee: 0.1, cardmarketFee: 0.05, shippingCost: 5 },
      });
    }

    // Buscar cartas com snapshots recentes (últimos 7 dias) para performance
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const cards = await prisma.card.findMany({
      include: {
        set: true,
        priceSnapshots: {
          where: { timestamp: { gte: sevenDaysAgo } },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    console.log(`[OpportunityCache] Processando ${cards.length} cartas...`);

    const opportunities: Array<{
      cardId: string;
      cardName: string;
      setName: string;
      rarity: string | null;
      imageSmall: string | null;
      psaGrade: number | null;
      buyPrice: number;
      buySource: string;
      buyCurrency: string;
      sellPrice: number;
      sellSource: string;
      sellCurrency: string;
      spread: number;
      netProfit: number;
      roi: number;
      fxRate: number;
      momentum: number;
      opportunityScore: number;
      liquidity: number;
    }> = [];

    for (const card of cards) {
      const tcgSnapshots = card.priceSnapshots.filter((p) => p.source === 'tcgplayer');
      const cmSnapshots = card.priceSnapshots.filter((p) => p.source === 'cardmarket');

      const tcgPrice = tcgSnapshots[0];
      const cmPrice = cmSnapshots[0];

      const tcgMarketUsd = tcgPrice?.priceMarket ?? 0;
      const cmMarketEur = cmPrice?.priceMarket ?? 0;
      const cmMarketUsd = cmMarketEur * settings.fxRateEurUsd;

      const tcgMomentum = calculateMomentum(tcgSnapshots.map(s => ({ priceMarket: s.priceMarket, timestamp: s.timestamp })));
      const cmMomentum = calculateMomentum(cmSnapshots.map(s => ({ priceMarket: s.priceMarket, timestamp: s.timestamp })));
      const avgMomentum = (tcgMomentum + cmMomentum) / 2;

      const allPrices = [...tcgSnapshots, ...cmSnapshots].map(s => s.priceMarket ?? 0).filter(p => p > 0);
      const avgPrice = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0;
      const variance = avgPrice > 0 ? Math.sqrt(allPrices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / allPrices.length) / avgPrice * 100 : 0;
      const liquidity = calculateLiquidity(tcgSnapshots.length + cmSnapshots.length, variance);

      let buyPrice = 0, buySource = '', buyCurrency = 'USD';
      let sellPrice = 0, sellSource = '', sellCurrency = 'USD';
      let buyPriceOriginal = 0, sellPriceOriginal = 0;

      if (tcgMarketUsd > 0 && cmMarketUsd > 0) {
        if (tcgMarketUsd < cmMarketUsd) {
          buyPrice = tcgMarketUsd;
          buyPriceOriginal = tcgMarketUsd;
          buySource = 'tcgplayer';
          buyCurrency = 'USD';
          sellPrice = cmMarketUsd;
          sellPriceOriginal = cmMarketEur;
          sellSource = 'cardmarket';
          sellCurrency = 'EUR';
        } else {
          buyPrice = cmMarketUsd;
          buyPriceOriginal = cmMarketEur;
          buySource = 'cardmarket';
          buyCurrency = 'EUR';
          sellPrice = tcgMarketUsd;
          sellPriceOriginal = tcgMarketUsd;
          sellSource = 'tcgplayer';
          sellCurrency = 'USD';
        }
      } else if (tcgMarketUsd > 0) {
        buyPrice = tcgMarketUsd;
        buyPriceOriginal = tcgMarketUsd;
        buySource = 'tcgplayer';
        sellPrice = tcgMarketUsd;
        sellPriceOriginal = tcgMarketUsd;
        sellSource = 'tcgplayer';
      } else if (cmMarketUsd > 0) {
        buyPrice = cmMarketUsd;
        buyPriceOriginal = cmMarketEur;
        buySource = 'cardmarket';
        buyCurrency = 'EUR';
        sellPrice = cmMarketUsd;
        sellPriceOriginal = cmMarketEur;
        sellSource = 'cardmarket';
        sellCurrency = 'EUR';
      }

      if (buyPrice === 0) continue;

      const buyFee = buySource === 'tcgplayer' ? settings.tcgplayerFee : settings.cardmarketFee;
      // Taxa de venda: usa marketplaceFee (12% padrão) para revenda no Brasil
      const marketplaceFee = (settings as { marketplaceFee?: number }).marketplaceFee ?? 0.12;
      const sellFee = marketplaceFee; // Taxa do marketplace BR (Mercado Livre, etc)
      const totalBuyCost = buyPrice * (1 + buyFee) + settings.shippingCost;
      const netSellRevenue = sellPrice * (1 - sellFee);

      const netProfit = netSellRevenue - totalBuyCost;
      const roi = totalBuyCost > 0 ? (netProfit / totalBuyCost) * 100 : 0;
      const spread = sellPrice - buyPrice;

      // Filtrar ROI negativo
      if (roi < 0) continue;

      const opportunityScore = calculateOpportunityScore(roi, netProfit, avgMomentum, spread);

      opportunities.push({
        cardId: card.id,
        cardName: card.name,
        setName: card.set?.name ?? '',
        rarity: card.rarity,
        imageSmall: card.imageSmall,
        psaGrade: card.psaGrade,
        buyPrice: Math.round(buyPriceOriginal * 100) / 100,
        buySource,
        buyCurrency,
        sellPrice: Math.round(sellPriceOriginal * 100) / 100,
        sellSource,
        sellCurrency,
        spread: Math.round(spread * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        fxRate: settings.fxRateEurUsd,
        momentum: Math.round(avgMomentum * 100) / 100,
        opportunityScore: Math.round(opportunityScore * 100) / 100,
        liquidity: Math.round(liquidity * 100) / 100,
      });
    }

    // Ordenar por score e pegar top 100
    opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
    const top100 = opportunities.slice(0, 100);

    console.log(`[OpportunityCache] ${top100.length} oportunidades calculadas. Salvando no banco...`);

    // Limpar cache antigo e inserir novo (transação)
    await prisma.$transaction(async (tx) => {
      await tx.opportunityCache.deleteMany({});
      for (const opp of top100) {
        await tx.opportunityCache.create({ data: opp });
      }
    });

    console.log('[OpportunityCache] Cache atualizado com sucesso!');

    return NextResponse.json({ 
      success: true, 
      cached: top100.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[OpportunityCache] Erro:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
