import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const POKEMON_API = 'https://api.pokemontcg.io/v2';
const PRICETRACKER_API = 'https://www.pokemonpricetracker.com/api/v1';

function getPriceTrackerApiKey(): string | null {
  return process.env.PRICETRACKER_API_KEY ?? null;
}

interface ApiCard {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  images?: {
    small?: string;
    large?: string;
  };
  tcgplayer?: {
    prices?: {
      normal?: { low?: number; market?: number; };
      holofoil?: { low?: number; market?: number; };
      reverseHolofoil?: { low?: number; market?: number; };
    };
  };
  cardmarket?: {
    prices?: {
      lowPrice?: number;
      averageSellPrice?: number;
      trendPrice?: number;
    };
  };
}

interface ApiSet {
  id: string;
  name: string;
  series?: string;
  releaseDate?: string;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { 
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(60000)
      });
      if (res.ok) return res;
      console.log(`Fetch failed (${res.status}), retry ${i + 1}/${retries}`);
    } catch (err) {
      console.log(`Fetch error, retry ${i + 1}/${retries}`);
    }
    await new Promise(r => setTimeout(r, 2000 * (i + 1)));
  }
  return null;
}

async function updateProgress(current: number, total: number, currentSet: string, totalCards: number) {
  const progress = JSON.stringify({
    active: true,
    current,
    total,
    percent: Math.round((current / total) * 100),
    currentSet,
    totalCards,
  });
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { seedProgress: progress },
    create: { id: 1, seedProgress: progress },
  });
}

async function clearProgress() {
  await prisma.settings.update({
    where: { id: 1 },
    data: { seedProgress: null },
  }).catch(() => {});
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const reset = url.searchParams.get('reset') === 'true';
    const BATCH_SIZE = 25; // Process 25 sets per seed call
    
    console.log('Starting seed process...');
    let totalCards = 0;
    let totalPrices = 0;
    const errors: string[] = [];

    // Get current seed index
    let settings = await prisma.settings.findFirst();
    let startIndex = reset ? 0 : (settings?.lastSeedIndex ?? 0);

    // Fetch ALL sets from the API
    console.log('Fetching all sets from Pokemon TCG API...');
    const allSetsRes = await fetchWithRetry(`${POKEMON_API}/sets?orderBy=-releaseDate`);
    if (!allSetsRes) {
      await clearProgress();
      return NextResponse.json({ error: 'Failed to fetch sets list' }, { status: 500 });
    }
    const allSetsData = await allSetsRes.json();
    const allSets: ApiSet[] = allSetsData?.data ?? [];
    const totalSets = allSets.length;
    
    // Get batch to process
    const endIndex = Math.min(startIndex + BATCH_SIZE, totalSets);
    const batchSets = allSets.slice(startIndex, endIndex);
    console.log(`Processing sets ${startIndex + 1} to ${endIndex} of ${totalSets}`);

    for (let i = 0; i < batchSets.length; i++) {
      const setInfo = batchSets[i];
      const setId = setInfo.id;
      const globalIndex = startIndex + i;
      console.log(`Processing set ${globalIndex + 1}/${totalSets}: ${setId} - ${setInfo.name}`);
      
      // Update progress
      await updateProgress(globalIndex + 1, totalSets, setInfo.name, totalCards);

      if (setInfo) {
        await prisma.set.upsert({
          where: { id: setInfo.id },
          update: { name: setInfo.name, series: setInfo.series ?? null, releaseDate: setInfo.releaseDate ?? null },
          create: { id: setInfo.id, name: setInfo.name, series: setInfo.series ?? null, releaseDate: setInfo.releaseDate ?? null },
        });
        console.log(`Set ${setId} upserted`);
      }

      // Fetch ALL cards for this set (paginated)
      let allCards: ApiCard[] = [];
      let page = 1;
      const pageSize = 250;
      
      while (true) {
        const cardsRes = await fetchWithRetry(`${POKEMON_API}/cards?q=set.id:${setId}&pageSize=${pageSize}&page=${page}`);
        if (!cardsRes) {
          errors.push(`Failed to fetch cards for set ${setId} page ${page}`);
          break;
        }
        const cardsData = await cardsRes.json();
        const cards: ApiCard[] = cardsData?.data ?? [];
        if (cards.length === 0) break;
        allCards = allCards.concat(cards);
        if (cards.length < pageSize) break;
        page++;
      }
      
      const cards = allCards;
      console.log(`Found ${cards.length} cards for set ${setId}`);

      for (const card of cards) {
        if (!card?.id) continue;

        try {
          // Generate PSA grade based on rarity (simulation)
          const rarityGrades: Record<string, number[]> = {
            'Rare Holo': [8, 9, 10],
            'Rare': [7, 8, 9],
            'Uncommon': [6, 7, 8],
            'Common': [5, 6, 7],
          };
          const grades = rarityGrades[card.rarity ?? ''] ?? [5, 6, 7, 8, 9];
          const psaGrade = grades[Math.floor(Math.random() * grades.length)];

          await prisma.card.upsert({
            where: { id: card.id },
            update: {
              name: card.name ?? 'Unknown',
              number: card.number ?? null,
              rarity: card.rarity ?? null,
              imageSmall: card.images?.small ?? null,
              imageLarge: card.images?.large ?? null,
              psaGrade,
            },
            create: {
              id: card.id,
              name: card.name ?? 'Unknown',
              setId: setId,
              number: card.number ?? null,
              rarity: card.rarity ?? null,
              imageSmall: card.images?.small ?? null,
              imageLarge: card.images?.large ?? null,
              psaGrade,
            },
          });

          // Delete old price snapshots for this card
          await prisma.priceSnapshot.deleteMany({ where: { cardId: card.id } });

          // TCGplayer prices
          const tcgPrices = card.tcgplayer?.prices?.holofoil ?? card.tcgplayer?.prices?.reverseHolofoil ?? card.tcgplayer?.prices?.normal;
          if (tcgPrices && (tcgPrices.low || tcgPrices.market)) {
            await prisma.priceSnapshot.create({
              data: {
                cardId: card.id,
                source: 'tcgplayer',
                currency: 'USD',
                priceLow: tcgPrices.low ?? null,
                priceMarket: tcgPrices.market ?? null,
                priceTrend: null,
              },
            });
            totalPrices++;
          }

          // Cardmarket prices
          const cmPrices = card.cardmarket?.prices;
          if (cmPrices && (cmPrices.lowPrice || cmPrices.averageSellPrice || cmPrices.trendPrice)) {
            await prisma.priceSnapshot.create({
              data: {
                cardId: card.id,
                source: 'cardmarket',
                currency: 'EUR',
                priceLow: cmPrices.lowPrice ?? null,
                priceMarket: cmPrices.averageSellPrice ?? null,
                priceTrend: cmPrices.trendPrice ?? null,
              },
            });
            totalPrices++;
          }

          // Fetch PSA graded prices from PokemonPriceTracker
          const apiKey = getPriceTrackerApiKey();
          if (apiKey) {
            try {
              const ptRes = await fetch(`${PRICETRACKER_API}/cards/search?q=${encodeURIComponent(card.name)}`, {
                headers: { 'X-API-Key': apiKey }
              });
              if (ptRes.ok) {
                const ptData = await ptRes.json();
                const ptCard = ptData?.cards?.[0];
                if (ptCard?.psa_prices) {
                  for (const [grade, price] of Object.entries(ptCard.psa_prices)) {
                    if (price && typeof price === 'number' && price > 0) {
                      await prisma.priceSnapshot.create({
                        data: {
                          cardId: card.id,
                          source: 'pricetracker',
                          currency: 'USD',
                          priceMarket: price,
                          psaGrade: parseInt(grade.replace('psa', '')),
                        },
                      });
                      totalPrices++;
                    }
                  }
                }
              }
            } catch (ptErr) {
              console.log(`PriceTracker fetch error for ${card.name}:`, ptErr);
            }
          }

          totalCards++;
        } catch (cardErr) {
          console.error(`Error processing card ${card.id}:`, cardErr);
        }
      }
    }

    // Save progress index
    const newIndex = endIndex >= totalSets ? 0 : endIndex;
    await prisma.settings.upsert({
      where: { id: 1 },
      update: { lastSeedIndex: newIndex, seedProgress: null },
      create: { id: 1, lastSeedIndex: newIndex },
    });

    const isComplete = endIndex >= totalSets;
    const message = isComplete 
      ? `✅ COMPLETO! Carregadas ${totalCards} cartas de ${totalSets} coleções`
      : `Lote ${Math.ceil(endIndex / 25)} de ${Math.ceil(totalSets / 25)} concluído. ${totalCards} cartas processadas. Clique novamente para continuar.`;
    
    console.log(message);
    if (errors.length > 0) console.log('Errors:', errors);
    
    return NextResponse.json({ 
      message, 
      success: true, 
      totalCards, 
      totalPrices, 
      isComplete,
      progress: { current: endIndex, total: totalSets, percent: Math.round((endIndex / totalSets) * 100) },
      errors 
    });
  } catch (error) {
    await clearProgress();
    console.error('Seed error:', error);
    return NextResponse.json({ message: `Seed failed: ${error}`, success: false }, { status: 500 });
  }
}
