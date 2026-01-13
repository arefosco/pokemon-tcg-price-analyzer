import { prisma } from '@/lib/db';
import Header from '@/components/header';
import CardDetail from '@/components/card-detail';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

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
  return Math.min(Math.max(roiScore * 0.35 + profitScore * 0.25 + momentumScore * 0.20 + spreadScore * 0.20, 0), 100);
}

async function getSettings() {
  let settings = await prisma.settings.findFirst({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 1, baseCurrency: 'USD', fxRateEurUsd: 1.08, minRoiThreshold: 10, tcgplayerFee: 0.1, cardmarketFee: 0.05, shippingCost: 5 },
    });
  }
  return settings;
}

export default async function CardPage({ params }: { params: { id: string } }) {
  const cardId = params?.id;
  if (!cardId) return notFound();

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      set: true,
      priceSnapshots: { orderBy: { timestamp: 'desc' } },
    },
  }).catch(() => null);

  if (!card) return notFound();

  const settings = await getSettings();
  
  const tcgSnapshots = card?.priceSnapshots?.filter((p) => p?.source === 'tcgplayer') ?? [];
  const cmSnapshots = card?.priceSnapshots?.filter((p) => p?.source === 'cardmarket') ?? [];
  const psaSnapshots = card?.priceSnapshots?.filter((p) => p?.source === 'pricetracker' && p?.psaGrade) ?? [];
  
  const tcgPrices = tcgSnapshots[0];
  const cmPrices = cmSnapshots[0];

  const tcgMarketUsd = tcgPrices?.priceMarket ?? 0;
  const cmMarketEur = cmPrices?.priceMarket ?? 0;
  const cmMarketUsd = cmMarketEur * settings.fxRateEurUsd;
  const basePrice = tcgMarketUsd || cmMarketUsd || 10;

  const tcgMomentum = calculateMomentum(tcgSnapshots.map(s => ({ priceMarket: s.priceMarket, timestamp: s.timestamp })));
  const cmMomentum = calculateMomentum(cmSnapshots.map(s => ({ priceMarket: s.priceMarket, timestamp: s.timestamp })));
  const avgMomentum = (tcgMomentum + cmMomentum) / 2;

  let buyPrice = 0, sellPrice = 0, buySource = '', sellSource = '';
  if (tcgMarketUsd > 0 && cmMarketUsd > 0) {
    if (tcgMarketUsd < cmMarketUsd) {
      buyPrice = tcgMarketUsd; buySource = 'tcgplayer';
      sellPrice = cmMarketUsd; sellSource = 'cardmarket';
    } else {
      buyPrice = cmMarketUsd; buySource = 'cardmarket';
      sellPrice = tcgMarketUsd; sellSource = 'tcgplayer';
    }
  } else if (tcgMarketUsd > 0) {
    buyPrice = sellPrice = tcgMarketUsd;
  } else if (cmMarketUsd > 0) {
    buyPrice = sellPrice = cmMarketUsd;
  }

  const buyFee = buySource === 'tcgplayer' ? settings.tcgplayerFee : settings.cardmarketFee;
  const sellFee = sellSource === 'tcgplayer' ? settings.tcgplayerFee : settings.cardmarketFee;
  const totalBuyCost = buyPrice * (1 + buyFee) + settings.shippingCost;
  const netSellRevenue = sellPrice * (1 - sellFee);
  const netProfit = netSellRevenue - totalBuyCost;
  const roi = totalBuyCost > 0 ? (netProfit / totalBuyCost) * 100 : 0;
  const spread = sellPrice - buyPrice;
  const opportunityScore = calculateOpportunityScore(roi, netProfit, avgMomentum, spread);

  // Calculate PSA opportunities sorted by ROI descending
  const psaOpportunities = psaSnapshots.length > 0 
    ? psaSnapshots.map(snap => {
        const pBuy = (snap.priceMarket ?? 0) * 0.85;
        const pSell = (snap.priceMarket ?? 0) * 1.1;
        const pProfit = pSell * (1 - settings.tcgplayerFee) - pBuy * (1 + settings.tcgplayerFee) - settings.shippingCost;
        const pRoi = pBuy > 0 ? (pProfit / (pBuy + settings.shippingCost)) * 100 : 0;
        return { grade: snap.psaGrade!, buyPrice: pBuy, sellPrice: pSell, profit: pProfit, roi: pRoi };
      })
    : [10, 9, 8, 7, 6].map(grade => {
        const mult: Record<number, number> = { 10: 5, 9: 2.5, 8: 1.5, 7: 1.2, 6: 1 };
        const pBuy = basePrice * mult[grade] * 0.85;
        const pSell = basePrice * mult[grade] * 1.1;
        const pProfit = pSell * (1 - settings.tcgplayerFee) - pBuy * (1 + settings.tcgplayerFee) - settings.shippingCost;
        const pRoi = pBuy > 0 ? (pProfit / (pBuy + settings.shippingCost)) * 100 : 0;
        return { grade, buyPrice: pBuy, sellPrice: pSell, profit: pProfit, roi: pRoi };
      });
  
  psaOpportunities.sort((a, b) => b.roi - a.roi);

  const priceHistory = card.priceSnapshots.filter(s => s.source !== 'pricetracker').map(s => ({
    priceLow: s.priceLow,
    priceMarket: s.priceMarket,
    priceTrend: s.priceTrend,
    timestamp: s.timestamp.toISOString(),
    source: s.source,
  }));

  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      <Header />
      <CardDetail
        card={{
          id: card?.id ?? '',
          name: card?.name ?? '',
          setName: card?.set?.name ?? '',
          number: card?.number ?? '',
          rarity: card?.rarity ?? '',
          imageSmall: card?.imageSmall ?? '',
          imageLarge: card?.imageLarge ?? '',
        }}
        tcgPrices={tcgPrices ? { priceLow: tcgPrices?.priceLow ?? null, priceMarket: tcgPrices?.priceMarket ?? null, priceTrend: tcgPrices?.priceTrend ?? null } : null}
        cmPrices={cmPrices ? { priceLow: cmPrices?.priceLow ?? null, priceMarket: cmPrices?.priceMarket ?? null, priceTrend: cmPrices?.priceTrend ?? null } : null}
        spread={Math.round(spread * 100) / 100}
        roi={Math.round(roi * 100) / 100}
        netProfit={Math.round(netProfit * 100) / 100}
        momentum={Math.round(avgMomentum * 100) / 100}
        opportunityScore={Math.round(opportunityScore * 100) / 100}
        priceHistory={priceHistory}
        psaOpportunities={psaOpportunities.slice(0, 5).map(p => ({
          grade: p.grade,
          buyPrice: Math.round(p.buyPrice * 100) / 100,
          sellPrice: Math.round(p.sellPrice * 100) / 100,
          profit: Math.round(p.profit * 100) / 100,
          roi: Math.round(p.roi * 100) / 100,
        }))}
      />
    </main>
  );
}
