import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Get all untriggered alerts
    const alerts = await prisma.alert.findMany({
      where: { triggered: false },
      include: {
        card: {
          include: {
            set: true,
            priceSnapshots: { take: 2, orderBy: { timestamp: 'desc' } },
          },
        },
      },
    });

    const notificationsSent: string[] = [];
    const appUrl = process.env.NEXTAUTH_URL || 'https://poketcg.abacusai.app';
    const appName = 'Pokemon TCG Analyzer';

    for (const alert of alerts) {
      const tcg = alert.card.priceSnapshots.find((p) => p.source === 'tcgplayer');
      const cm = alert.card.priceSnapshots.find((p) => p.source === 'cardmarket');
      const tcgPrice = tcg?.priceMarket ?? 0;
      const cmPrice = (cm?.priceMarket ?? 0) * 1.08;
      const buyPrice = Math.min(tcgPrice || Infinity, cmPrice || Infinity);
      const sellPrice = Math.max(tcgPrice, cmPrice);
      const roi = buyPrice > 0 && buyPrice !== Infinity ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

      if (roi >= alert.roiThreshold) {
        // Send email notification
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FFD700; background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; margin: 0;">
              \u26a1 Alerta de Pre\u00e7o Atingido!
            </h2>
            <div style="background: #16213e; padding: 20px; color: #fff;">
              <h3 style="color: #FFD700; margin-top: 0;">${alert.cardName}</h3>
              <p style="color: #aaa;">Set: ${alert.card.set?.name ?? 'N/A'}</p>
              
              <div style="background: #0f3460; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>ROI Atual:</strong> <span style="color: #4ade80; font-size: 24px; font-weight: bold;">${roi.toFixed(1)}%</span></p>
                <p style="margin: 5px 0;"><strong>Threshold:</strong> ${alert.roiThreshold}%</p>
              </div>
              
              <div style="display: flex; gap: 20px; margin: 15px 0;">
                <div style="flex: 1; background: #1a1a2e; padding: 10px; border-radius: 8px;">
                  <p style="margin: 0; color: #aaa; font-size: 12px;">TCGplayer (USD)</p>
                  <p style="margin: 5px 0 0; font-size: 18px;">$${tcgPrice.toFixed(2)}</p>
                </div>
                <div style="flex: 1; background: #1a1a2e; padding: 10px; border-radius: 8px;">
                  <p style="margin: 0; color: #aaa; font-size: 12px;">Cardmarket (EUR)</p>
                  <p style="margin: 5px 0 0; font-size: 18px;">\u20ac${(cm?.priceMarket ?? 0).toFixed(2)}</p>
                </div>
              </div>
              
              <a href="${appUrl}/cards/${alert.cardId}" style="display: inline-block; background: #FFD700; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">
                Ver Detalhes da Carta
              </a>
            </div>
            <p style="color: #666; font-size: 12px; padding: 15px; background: #1a1a2e; border-radius: 0 0 8px 8px; margin: 0;">
              Enviado por ${appName} em ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        `;

        try {
          const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deployment_token: process.env.ABACUSAI_API_KEY,
              subject: `\u26a1 Alerta TCG: ${alert.cardName} atingiu ${roi.toFixed(1)}% ROI!`,
              body: htmlBody,
              is_html: true,
              recipient_email: alert.email,
              sender_email: `noreply@poketcg.abacusai.app`,
              sender_alias: appName,
            }),
          });

          if (response.ok) {
            // Mark alert as triggered
            await prisma.alert.update({
              where: { id: alert.id },
              data: { triggered: true, triggeredAt: new Date() },
            });
            notificationsSent.push(alert.email);
          }
        } catch (emailError) {
          console.error('Email send error:', emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: alerts.length,
      notified: notificationsSent.length,
    });
  } catch (error) {
    console.error('Alert notification error:', error);
    return NextResponse.json({ error: 'Failed to process alerts' }, { status: 500 });
  }
}
