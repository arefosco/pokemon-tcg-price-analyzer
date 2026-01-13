import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface BCBResponse {
  value: Array<{
    cotacaoCompra: number;
    cotacaoVenda: number;
    dataHoraCotacao: string;
  }>;
}

async function fetchPTAX(currency: string): Promise<{ buy: number; sell: number; date: string } | null> {
  try {
    const today = new Date();
    
    // Try today first, then go back up to 5 days for weekends/holidays
    for (let i = 0; i < 5; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const formattedDate = checkDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${currency}'&@dataCotacao='${formattedDate}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json`;
      
      const res = await fetch(url, { 
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!res.ok) continue;
      
      const data: BCBResponse = await res.json();
      if (data?.value?.length > 0) {
        const rate = data.value[0];
        return {
          buy: rate.cotacaoCompra,
          sell: rate.cotacaoVenda,
          date: checkDate.toISOString().split('T')[0]
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Error fetching PTAX for ${currency}:`, error);
    return null;
  }
}

// Busca cotações dos últimos 7 dias úteis para calcular média
async function fetchWeeklyPTAX(currency: string): Promise<number[]> {
  const rates: number[] = [];
  const today = new Date();
  
  try {
    for (let i = 0; i < 14 && rates.length < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const formattedDate = checkDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${currency}'&@dataCotacao='${formattedDate}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json`;
      
      const res = await fetch(url, { 
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!res.ok) continue;
      
      const data: BCBResponse = await res.json();
      if (data?.value?.length > 0) {
        rates.push(data.value[0].cotacaoVenda);
      }
    }
  } catch (error) {
    console.error(`Error fetching weekly PTAX for ${currency}:`, error);
  }
  
  return rates;
}

export async function GET() {
  try {
    // Buscar settings para o threshold de alerta
    const settings = await prisma.settings.findFirst({ where: { id: 1 } });
    const importAlertThreshold = settings?.importAlertThreshold ?? 3;

    const [usd, eur, jpy] = await Promise.all([
      fetchPTAX('USD'),
      fetchPTAX('EUR'),
      fetchPTAX('JPY'),
    ]);

    // Buscar média semanal do USD para alerta de importação
    const weeklyUsdRates = await fetchWeeklyPTAX('USD');
    const weeklyAvg = weeklyUsdRates.length > 1 
      ? weeklyUsdRates.slice(1).reduce((a, b) => a + b, 0) / (weeklyUsdRates.length - 1) // Exclui hoje
      : 0;

    const rates = [];
    let importAlert = null;
    
    if (usd) {
      const currentRate = usd.sell;
      const variation = weeklyAvg > 0 ? ((currentRate - weeklyAvg) / weeklyAvg) * 100 : 0;
      
      rates.push({ 
        currency: 'USD/BRL', 
        symbol: '$', 
        buyRate: usd.buy, 
        sellRate: usd.sell, 
        date: usd.date,
        weeklyAvg: Math.round(weeklyAvg * 100) / 100,
        variation: Math.round(variation * 100) / 100
      });

      // Alerta de oportunidade de importação quando dólar está X% abaixo da média
      if (variation <= -importAlertThreshold) {
        importAlert = {
          type: 'import_opportunity',
          message: `Dólar ${Math.abs(variation).toFixed(1)}% abaixo da média semanal! Boa hora para importar.`,
          currentRate: currentRate,
          weeklyAvg: weeklyAvg,
          variation: variation,
          savings: `Economia de R$ ${((weeklyAvg - currentRate) * 100).toFixed(2)} a cada $100 importados`
        };
      }
    }
    if (eur) {
      rates.push({ currency: 'EUR/BRL', symbol: '€', buyRate: eur.buy, sellRate: eur.sell, date: eur.date });
    }
    if (jpy) {
      rates.push({ currency: 'JPY/BRL', symbol: '¥', buyRate: jpy.buy, sellRate: jpy.sell, date: jpy.date });
    }

    return NextResponse.json({ 
      rates, 
      importAlert,
      importAlertThreshold,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching PTAX rates:', error);
    return NextResponse.json({ rates: [], importAlert: null, success: false }, { status: 500 });
  }
}
