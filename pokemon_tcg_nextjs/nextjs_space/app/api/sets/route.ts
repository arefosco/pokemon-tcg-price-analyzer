import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Cache por 5 minutos (dados de sets mudam raramente)
export const revalidate = 300;

export async function GET() {
  try {
    const sets = await prisma.set.findMany({
      orderBy: { releaseDate: 'desc' },
      include: { _count: { select: { cards: true } } },
    });
    const totalCards = await prisma.card.count();
    
    const response = NextResponse.json({ sets: sets ?? [], totalCards });
    // Cache no browser por 5 min, CDN por 1 hora
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('Error fetching sets:', error);
    return NextResponse.json({ sets: [], totalCards: 0 }, { status: 500 });
  }
}