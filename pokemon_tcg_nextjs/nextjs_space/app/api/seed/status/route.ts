import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    const seedProgress = settings?.seedProgress ?? null;
    
    if (!seedProgress) {
      return NextResponse.json({ active: false });
    }
    
    const progress = JSON.parse(seedProgress);
    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ active: false });
  }
}
