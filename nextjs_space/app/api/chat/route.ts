import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Fetch current opportunities data for context
    const cards = await prisma.card.findMany({
      take: 20,
      include: {
        set: true,
        priceSnapshots: { take: 2, orderBy: { timestamp: 'desc' } },
      },
    });

    const opportunities = cards.map((card) => {
      const tcg = card.priceSnapshots.find((p) => p.source === 'tcgplayer');
      const cm = card.priceSnapshots.find((p) => p.source === 'cardmarket');
      const tcgPrice = tcg?.priceMarket ?? 0;
      const cmPrice = (cm?.priceMarket ?? 0) * 1.08;
      const buyPrice = Math.min(tcgPrice || Infinity, cmPrice || Infinity);
      const sellPrice = Math.max(tcgPrice, cmPrice);
      const roi = buyPrice > 0 && buyPrice !== Infinity ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;
      return {
        name: card.name,
        set: card.set?.name,
        rarity: card.rarity,
        tcgPrice,
        cmPrice: cm?.priceMarket ?? 0,
        roi: roi.toFixed(1),
      };
    }).filter(o => o.tcgPrice > 0 || o.cmPrice > 0);

    const systemPrompt = `Voc\u00ea \u00e9 um assistente especializado em Pokemon TCG e arbitragem de pre\u00e7os entre TCGplayer (USD) e Cardmarket (EUR).

Dados atuais das oportunidades:
${JSON.stringify(opportunities.slice(0, 10), null, 2)}

Voc\u00ea pode:
- Analisar oportunidades de arbitragem
- Explicar como funciona o ROI e spread
- Recomendar cartas para compra/venda
- Responder sobre raridades, sets e pre\u00e7os
- Dar dicas sobre o mercado de Pokemon TCG

Responda sempre em portugu\u00eas de forma concisa e \u00fatil.`;

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 1000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error('LLM API error');
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        try {
          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
