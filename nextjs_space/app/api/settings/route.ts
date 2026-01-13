import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 1,
          baseCurrency: 'USD',
          fxRateEurUsd: 1.08,
          minRoiThreshold: 10,
          tcgplayerFee: 0.1,
          cardmarketFee: 0.05,
          marketplaceFee: 0.12,
          shippingCost: 5,
          importAlertThreshold: 3,
        },
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        baseCurrency: body.baseCurrency,
        fxRateEurUsd: body.fxRateEurUsd,
        minRoiThreshold: body.minRoiThreshold,
        tcgplayerFee: body.tcgplayerFee,
        cardmarketFee: body.cardmarketFee,
        marketplaceFee: body.marketplaceFee,
        shippingCost: body.shippingCost,
        importAlertThreshold: body.importAlertThreshold,
      },
      create: {
        id: 1,
        baseCurrency: body.baseCurrency ?? 'USD',
        fxRateEurUsd: body.fxRateEurUsd ?? 1.08,
        minRoiThreshold: body.minRoiThreshold ?? 10,
        tcgplayerFee: body.tcgplayerFee ?? 0.1,
        cardmarketFee: body.cardmarketFee ?? 0.05,
        marketplaceFee: body.marketplaceFee ?? 0.12,
        shippingCost: body.shippingCost ?? 5,
        importAlertThreshold: body.importAlertThreshold ?? 3,
      },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
