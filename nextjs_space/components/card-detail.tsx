'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Euro, TrendingUp, TrendingDown, Activity, Bell, Star, Minus, Heart, HeartOff, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PriceSnapshot {
  priceLow: number | null;
  priceMarket: number | null;
  priceTrend: number | null;
  timestamp: string;
  source: string;
}

interface PSAOpportunity {
  grade: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  roi: number;
}

interface CardDetailProps {
  card: {
    id: string;
    name: string;
    setName: string;
    number: string;
    rarity: string;
    imageSmall: string;
    imageLarge: string;
  };
  tcgPrices: {
    priceLow: number | null;
    priceMarket: number | null;
    priceTrend: number | null;
  } | null;
  cmPrices: {
    priceLow: number | null;
    priceMarket: number | null;
    priceTrend: number | null;
  } | null;
  spread: number;
  roi: number;
  netProfit?: number;
  momentum?: number;
  opportunityScore?: number;
  priceHistory?: PriceSnapshot[];
  psaOpportunities?: PSAOpportunity[];
}

function MomentumBadge({ momentum }: { momentum?: number }) {
  if (momentum === undefined || momentum === null) return null;
  
  if (momentum > 5) {
    return <span className="inline-flex items-center gap-1 text-green-400 font-medium"><TrendingUp className="w-4 h-4" /> +{momentum.toFixed(1)}%</span>;
  } else if (momentum < -5) {
    return <span className="inline-flex items-center gap-1 text-red-400 font-medium"><TrendingDown className="w-4 h-4" /> {momentum.toFixed(1)}%</span>;
  } else {
    return <span className="inline-flex items-center gap-1 text-gray-400 font-medium"><Minus className="w-4 h-4" /> {momentum.toFixed(1)}%</span>;
  }
}

export default function CardDetail({ card, tcgPrices, cmPrices, spread, roi, netProfit, momentum, opportunityScore, priceHistory, psaOpportunities }: CardDetailProps) {
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertRoi, setAlertRoi] = useState('20');
  const [alertSaved, setAlertSaved] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  useEffect(() => {
    // Check if card is in watchlist
    fetch('/api/watchlist')
      .then(res => res.json())
      .then(data => {
        const items = data?.items ?? [];
        setInWatchlist(items.some((i: { cardId: string }) => i.cardId === card.id));
      })
      .catch(console.error)
      .finally(() => setWatchlistLoading(false));
  }, [card.id]);

  const toggleWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await fetch('/api/watchlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card.id }),
        });
        setInWatchlist(false);
      } else {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card.id }),
        });
        setInWatchlist(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return [];
    
    const byDate: Record<string, { date: string; tcgplayer?: number; cardmarket?: number }> = {};
    
    priceHistory.forEach(snapshot => {
      const date = new Date(snapshot.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byDate[date]) byDate[date] = { date };
      if (snapshot.source === 'tcgplayer' && snapshot.priceMarket) {
        byDate[date].tcgplayer = snapshot.priceMarket;
      } else if (snapshot.source === 'cardmarket' && snapshot.priceMarket) {
        byDate[date].cardmarket = snapshot.priceMarket;
      }
    });
    
    return Object.values(byDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [priceHistory]);

  const handleCreateAlert = async () => {
    if (!alertEmail) return;
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          cardName: card.name,
          email: alertEmail,
          roiThreshold: parseFloat(alertRoi),
        }),
      });
      setAlertSaved(true);
      setTimeout(() => {
        setAlertSaved(false);
        setShowAlertForm(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-white transition mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Image */}
        <div className="bg-[hsl(var(--card))] rounded-xl p-6 shadow-lg flex items-center justify-center">
          <div className="relative w-64 h-96">
            <Image
              src={card?.imageLarge || card?.imageSmall || ''}
              alt={card?.name ?? 'Card'}
              fill
              className="object-contain rounded-lg"
              sizes="256px"
              priority
            />
          </div>
        </div>

        {/* Card Info & Scores */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[hsl(var(--card))] rounded-xl p-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{card?.name}</h1>
                <p className="text-[hsl(var(--muted-foreground))]">{card?.setName} • #{card?.number || '-'}</p>
              </div>
              {opportunityScore !== undefined && (
                <div className="text-center">
                  <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${
                    opportunityScore >= 80 ? 'bg-green-600/20 text-green-400' :
                    opportunityScore >= 60 ? 'bg-yellow-600/20 text-yellow-400' :
                    opportunityScore >= 40 ? 'bg-orange-600/20 text-orange-400' :
                    'bg-red-600/20 text-red-400'
                  }`}>
                    <Star className="w-5 h-5 inline mr-1" />
                    {opportunityScore.toFixed(0)}
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Score</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">Rarity</span>
                <p className="font-medium">{card?.rarity || '-'}</p>
              </div>
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">Momentum</span>
                <p className="font-medium"><MomentumBadge momentum={momentum} /></p>
              </div>
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">Net Profit</span>
                <p className={`font-medium ${(netProfit ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${(netProfit ?? spread).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">ROI</span>
                <p className={`font-bold ${(roi ?? 0) > 20 ? 'text-green-400' : (roi ?? 0) > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {(roi ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* PSA Grades Table - Sorted by ROI */}
          <div className="bg-[hsl(var(--card))] rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-[hsl(var(--primary))]" />
              <span className="font-semibold">Top 5 Oportunidades PSA por ROI</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(var(--muted))]">
                  <tr>
                    <th className="text-center px-3 py-2 rounded-tl">#</th>
                    <th className="text-left px-3 py-2">PSA</th>
                    <th className="text-right px-3 py-2">Compra</th>
                    <th className="text-right px-3 py-2">Venda</th>
                    <th className="text-right px-3 py-2">Lucro</th>
                    <th className="text-right px-3 py-2 rounded-tr">ROI ↓</th>
                  </tr>
                </thead>
                <tbody>
                  {(psaOpportunities ?? []).map((opp, idx) => {
                    const labels: Record<number, string> = { 10: 'GEM MT', 9: 'MINT', 8: 'NM-MT', 7: 'NM', 6: 'EX-MT', 5: 'EX', 4: 'VG-EX', 3: 'VG', 2: 'GOOD', 1: 'PR' };
                    const colors: Record<number, string> = { 10: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black', 9: 'bg-green-500', 8: 'bg-blue-500', 7: 'bg-cyan-500', 6: 'bg-purple-500', 5: 'bg-gray-500', 4: 'bg-gray-600', 3: 'bg-gray-600', 2: 'bg-gray-700', 1: 'bg-gray-700' };
                    return (
                      <tr key={opp.grade} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50">
                        <td className="text-center px-3 py-2 text-[hsl(var(--muted-foreground))]">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${colors[opp.grade] ?? 'bg-gray-500'} text-white`}>
                            {labels[opp.grade] ?? `PSA ${opp.grade}`} ({opp.grade})
                          </span>
                        </td>
                        <td className="text-right px-3 py-2">${opp.buyPrice.toFixed(2)}</td>
                        <td className="text-right px-3 py-2">${opp.sellPrice.toFixed(2)}</td>
                        <td className={`text-right px-3 py-2 font-medium ${opp.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${opp.profit.toFixed(2)}
                        </td>
                        <td className={`text-right px-3 py-2 font-bold ${opp.roi > 20 ? 'text-green-400' : opp.roi > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {opp.roi.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3">* Ordenado por ROI decrescente. Dados de preços PSA via PokemonPriceTracker API.</p>
          </div>

          {/* Watchlist & Alert Buttons */}
          <div className="bg-[hsl(var(--card))] rounded-xl p-4 shadow-lg space-y-3">
            <button
              onClick={toggleWatchlist}
              disabled={watchlistLoading}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                inWatchlist 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-pink-600 hover:bg-pink-700 text-white'
              }`}
            >
              {watchlistLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : inWatchlist ? (
                <><HeartOff className="w-4 h-4" /> Remover da Watchlist</>
              ) : (
                <><Heart className="w-4 h-4" /> Adicionar à Watchlist</>
              )}
            </button>
            {!showAlertForm ? (
              <button onClick={() => setShowAlertForm(true)} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                <Bell className="w-4 h-4" />
                Criar Alerta de Preço
              </button>
            ) : alertSaved ? (
              <div className="text-center text-green-400 py-2">Alert created successfully!</div>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="w-full bg-[hsl(var(--muted))] rounded px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="ROI threshold %"
                    value={alertRoi}
                    onChange={(e) => setAlertRoi(e.target.value)}
                    className="flex-1 bg-[hsl(var(--muted))] rounded px-3 py-2 text-sm"
                  />
                  <button onClick={handleCreateAlert} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">Save</button>
                  <button onClick={() => setShowAlertForm(false)} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price History Chart */}
      {chartData.length > 0 && (
        <div className="mt-8 bg-[hsl(var(--card))] rounded-xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[hsl(var(--primary))]" />
            Price History
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="tcgplayer" stroke="#22c55e" strokeWidth={2} name="TCGplayer ($)" dot={false} />
                <Line type="monotone" dataKey="cardmarket" stroke="#3b82f6" strokeWidth={2} name="Cardmarket (€)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      {opportunityScore !== undefined && (
        <div className="mt-6 bg-[hsl(var(--card))] rounded-xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4">Opportunity Score Breakdown</h2>
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div className="bg-[hsl(var(--muted))] rounded-lg p-3">
              <div className="text-[hsl(var(--muted-foreground))] mb-1">ROI Weight</div>
              <div className="font-bold">35%</div>
            </div>
            <div className="bg-[hsl(var(--muted))] rounded-lg p-3">
              <div className="text-[hsl(var(--muted-foreground))] mb-1">Profit Weight</div>
              <div className="font-bold">25%</div>
            </div>
            <div className="bg-[hsl(var(--muted))] rounded-lg p-3">
              <div className="text-[hsl(var(--muted-foreground))] mb-1">Momentum Weight</div>
              <div className="font-bold">20%</div>
            </div>
            <div className="bg-[hsl(var(--muted))] rounded-lg p-3">
              <div className="text-[hsl(var(--muted-foreground))] mb-1">Spread Weight</div>
              <div className="font-bold">20%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
