'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpDown, Filter, TrendingUp, TrendingDown, Minus, DollarSign, Euro, ChevronRight, Wallet, Star, RefreshCw, Info, Search, Download, BarChart3 } from 'lucide-react';

interface PTAXRate {
  currency: string;
  symbol: string;
  buyRate: number;
  sellRate: number;
  date: string;
  weeklyAvg?: number;
  variation?: number;
}

interface ImportAlert {
  type: string;
  message: string;
  currentRate: number;
  weeklyAvg: number;
  variation: number;
  savings: string;
}

interface Opportunity {
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
  momentum?: number;
  opportunityScore?: number;
  liquidity?: number;
  volatility?: number;
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

function Tooltip({ text, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    }
    setShow(true);
  };

  return (
    <div 
      ref={ref}
      className="inline-flex items-center gap-1 cursor-help"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <Info className="w-3 h-3 text-gray-500" />
      {show && typeof window !== 'undefined' && (
        <div 
          className="fixed px-3 py-2 bg-gray-900 border border-gray-500 text-white text-xs rounded-lg shadow-2xl w-64 pointer-events-none"
          style={{ 
            zIndex: 99999,
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-normal leading-relaxed">{text}</div>
        </div>
      )}
    </div>
  );
}

function MomentumBadge({ momentum }: { momentum?: number }) {
  if (momentum === undefined || momentum === null) return <span className="text-gray-500">-</span>;
  
  if (momentum > 5) {
    return <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium"><TrendingUp className="w-3 h-3" /> +{momentum.toFixed(1)}%</span>;
  } else if (momentum < -5) {
    return <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium"><TrendingDown className="w-3 h-3" /> {momentum.toFixed(1)}%</span>;
  } else {
    return <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium"><Minus className="w-3 h-3" /> {momentum.toFixed(1)}%</span>;
  }
}

function PSABadge({ grade }: { grade?: number | null }) {
  if (grade === undefined || grade === null) return <span className="text-gray-500">-</span>;
  
  let color = 'bg-gray-600 text-white';
  let label = '';
  if (grade === 10) { color = 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black'; label = 'GEM MT'; }
  else if (grade === 9) { color = 'bg-green-500 text-white'; label = 'MINT'; }
  else if (grade === 8) { color = 'bg-blue-500 text-white'; label = 'NM-MT'; }
  else if (grade === 7) { color = 'bg-cyan-500 text-white'; label = 'NM'; }
  else if (grade === 6) { color = 'bg-purple-500 text-white'; label = 'EX-MT'; }
  else if (grade <= 5) { color = 'bg-gray-500 text-white'; label = 'EX'; }
  
  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${color}`}>
      {label} ({grade})
    </span>
  );
}

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  
  let color = 'bg-gray-600';
  if (score >= 80) color = 'bg-green-600';
  else if (score >= 60) color = 'bg-yellow-600';
  else if (score >= 40) color = 'bg-orange-600';
  else color = 'bg-red-600';
  
  return <span className={`${color} text-white text-xs font-bold px-2 py-0.5 rounded`}>{score.toFixed(0)}</span>;
}

function LiquidityBar({ liquidity }: { liquidity?: number }) {
  if (liquidity === undefined) return <span className="text-gray-500">-</span>;
  const width = Math.min(liquidity, 100);
  let color = 'bg-red-500';
  if (liquidity >= 70) color = 'bg-green-500';
  else if (liquidity >= 40) color = 'bg-yellow-500';
  return (
    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${width}%` }}></div>
    </div>
  );
}

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState<{ id: string; name: string }[]>([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [minRoi, setMinRoi] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'roi' | 'spread' | 'netProfit' | 'opportunityScore' | 'liquidity'>('opportunityScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fxRate, setFxRate] = useState(1.08);
  const [ptaxRates, setPtaxRates] = useState<PTAXRate[]>([]);
  const [ptaxLoading, setPtaxLoading] = useState(true);
  const [importAlert, setImportAlert] = useState<ImportAlert | null>(null);
  
  // Global card search
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; setName: string; rarity: string | null; imageSmall: string | null }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalCards, setTotalCards] = useState(0);
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<string | null>(null);

  const rarities = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Holo EX', 'Rare Holo GX', 'Rare Holo V', 'Rare Ultra', 'Rare Secret'];

  useEffect(() => {
    fetch('/api/sets').then(res => res.json()).then(data => {
      setSets(data?.sets ?? []);
      setTotalCards(data?.totalCards ?? 0);
    }).catch(console.error);
    
    setPtaxLoading(true);
    fetch('/api/ptax')
      .then(res => res.json())
      .then(data => {
        setPtaxRates(data?.rates ?? []);
        setImportAlert(data?.importAlert ?? null);
      })
      .catch(console.error)
      .finally(() => setPtaxLoading(false));
  }, []);

  // Global search effect
  useEffect(() => {
    if (!globalSearch || globalSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/cards?search=${encodeURIComponent(globalSearch)}&limit=10`);
        const data = await res.json();
        setSearchResults((data?.cards ?? []).map((c: { id: string; name: string; set?: { name: string }; rarity: string | null; imageSmall: string | null }) => ({
          id: c.id,
          name: c.name,
          setName: c.set?.name ?? '',
          rarity: c.rarity,
          imageSmall: c.imageSmall,
        })));
      } catch (e) { console.error(e); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [globalSearch]);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchOpportunities = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSet) params.set('setId', selectedSet);
        if (selectedRarity) params.set('rarity', selectedRarity);
        if (minRoi > 0) params.set('minRoi', String(minRoi));
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        const res = await fetch(`/api/opportunities?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        setOpportunities(data?.opportunities ?? []);
        if (data?.settings?.fxRateEurUsd) setFxRate(data.settings.fxRateEurUsd);
        if (data?.cacheUpdatedAt) setCacheUpdatedAt(data.cacheUpdatedAt);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce de 200ms para evitar múltiplas chamadas
    const timeout = setTimeout(fetchOpportunities, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [selectedSet, selectedRarity, minRoi, sortBy, sortOrder]);

  const filteredOpportunities = opportunities.filter(opp => 
    !searchTerm || opp.cardName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const refreshPtax = () => {
    setPtaxLoading(true);
    fetch('/api/ptax')
      .then(res => res.json())
      .then(data => {
        setPtaxRates(data?.rates ?? []);
        setImportAlert(data?.importAlert ?? null);
      })
      .catch(console.error)
      .finally(() => setPtaxLoading(false));
  };

  const exportCSV = () => {
    const headers = ['Card', 'Set', 'Buy Price', 'Buy Source', 'Sell Price', 'Sell Source', 'Net Profit', 'ROI %', 'Momentum %', 'Score', 'Liquidity'];
    const rows = filteredOpportunities.map(o => [
      o.cardName, o.setName, o.buyPrice.toFixed(2), o.buySource, o.sellPrice.toFixed(2), o.sellSource,
      o.netProfit.toFixed(2), o.roi.toFixed(1), o.momentum?.toFixed(1) ?? '', o.opportunityScore?.toFixed(0) ?? '', o.liquidity?.toFixed(0) ?? ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opportunities_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Stats summary
  const avgRoi = filteredOpportunities.length > 0 ? filteredOpportunities.reduce((s, o) => s + o.roi, 0) / filteredOpportunities.length : 0;
  const totalProfit = filteredOpportunities.reduce((s, o) => s + Math.max(0, o.netProfit), 0);
  const highScoreCount = filteredOpportunities.filter(o => (o.opportunityScore ?? 0) >= 70).length;

  return (
    <div className="space-y-6">
      {/* Import Alert */}
      {importAlert && (
        <div className="bg-gradient-to-r from-green-900/70 to-emerald-900/70 rounded-lg p-4 border border-green-500/50 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-400 text-lg">🎯 Oportunidade de Importação!</h3>
              <p className="text-white mt-1">{importAlert.message}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span className="text-gray-300">Atual: <strong className="text-green-400">R$ {importAlert.currentRate.toFixed(4)}</strong></span>
                <span className="text-gray-300">Média 7 dias: <strong>R$ {importAlert.weeklyAvg.toFixed(4)}</strong></span>
                <span className="text-green-400 font-medium">{importAlert.savings}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PTAX Rates Box */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 border border-blue-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            PTAX - Banco Central do Brasil
          </h3>
          <button onClick={refreshPtax} disabled={ptaxLoading} className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${ptaxLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {ptaxLoading ? (
          <div className="text-center text-gray-400 py-2">Carregando cotações...</div>
        ) : ptaxRates.length === 0 ? (
          <div className="text-center text-gray-400 py-2">Cotações indisponíveis</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ptaxRates.map((rate) => (
              <div key={rate.currency} className="bg-black/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">{rate.currency}</span>
                  {rate.variation !== undefined && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      rate.variation < 0 ? 'bg-green-500/20 text-green-400' : 
                      rate.variation > 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {rate.variation > 0 ? '+' : ''}{rate.variation.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">R$ {rate.sellRate.toFixed(4)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Compra: R$ {rate.buyRate.toFixed(4)} | {rate.date}
                </div>
                {rate.weeklyAvg && rate.weeklyAvg > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Média 7 dias: R$ {rate.weeklyAvg.toFixed(4)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Card Search */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-[hsl(var(--primary))]" />
          <span className="font-semibold">Buscar Carta no Banco de Dados</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Digite o nome da carta para buscar..."
            className="w-full bg-[hsl(var(--muted))] rounded px-4 py-3 text-sm pr-10"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <RefreshCw className="w-4 h-4 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          )}
        </div>
        {searchResults.length > 0 && (
          <div className="mt-3 border border-[hsl(var(--border))] rounded-lg overflow-hidden">
            {searchResults.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="flex items-center gap-3 p-3 hover:bg-[hsl(var(--muted))] transition border-b border-[hsl(var(--border))] last:border-b-0"
              >
                {card.imageSmall && (
                  <div className="w-8 h-11 relative rounded overflow-hidden bg-[hsl(var(--muted))] flex-shrink-0">
                    <Image src={card.imageSmall} alt={card.name} fill className="object-contain" sizes="32px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{card.name}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">{card.setName} • {card.rarity}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              </Link>
            ))}
          </div>
        )}
        {globalSearch.length >= 2 && searchResults.length === 0 && !searchLoading && (
          <div className="mt-3 text-center text-[hsl(var(--muted-foreground))] py-4">
            Nenhuma carta encontrada para &quot;{globalSearch}&quot;
          </div>
        )}
      </div>

      {/* Cache Info */}
      {cacheUpdatedAt && (
        <div className="flex items-center justify-end gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <RefreshCw className="w-3 h-3" />
          <span>Dados atualizados em: {new Date(cacheUpdatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
        </div>
      )}

      {/* Stats Summary - Sprint 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 shadow">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Cartas no Banco</div>
          <div className="text-2xl font-bold text-purple-400">{totalCards.toLocaleString()}</div>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 shadow">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Top 20 Oportunidades</div>
          <div className="text-2xl font-bold">{filteredOpportunities.length}</div>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 shadow">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">ROI Médio</div>
          <div className="text-2xl font-bold text-yellow-400">{avgRoi.toFixed(1)}%</div>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 shadow">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Lucro Potencial Total</div>
          <div className="text-2xl font-bold text-green-400">${totalProfit.toFixed(2)}</div>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 shadow">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">Score Alto (≥70)</div>
          <div className="text-2xl font-bold text-blue-400">{highScoreCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[hsl(var(--primary))]" />
            <span className="font-semibold">Filtros</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">FX: 1 EUR = {fxRate} USD</span>
            <button onClick={exportCSV} className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition">
              <Download className="w-3 h-3" /> CSV
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1 block">Buscar Carta</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[hsl(var(--muted))] rounded pl-9 pr-3 py-2 text-sm" placeholder="Nome da carta..." />
            </div>
          </div>
          <div>
            <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1 block">Set</label>
            <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)} className="w-full bg-[hsl(var(--muted))] rounded px-3 py-2 text-sm">
              <option value="">Todos os Sets</option>
              {sets?.map((s) => <option key={s?.id} value={s?.id}>{s?.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1 block">Raridade</label>
            <select value={selectedRarity} onChange={(e) => setSelectedRarity(e.target.value)} className="w-full bg-[hsl(var(--muted))] rounded px-3 py-2 text-sm">
              <option value="">Todas</option>
              {rarities?.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1 block">Min ROI %</label>
            <input type="number" min="0" value={minRoi} onChange={(e) => setMinRoi(Number(e.target.value) || 0)} className="w-full bg-[hsl(var(--muted))] rounded px-3 py-2 text-sm" placeholder="0" />
          </div>
          <div>
            <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1 block">Ordenar Por</label>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => toggleSort('opportunityScore')} className={`flex items-center justify-center gap-1 px-2 py-2 rounded text-xs transition ${sortBy === 'opportunityScore' ? 'bg-[hsl(var(--primary))] text-black' : 'bg-[hsl(var(--muted))]'}`}>
                <Star className="w-3 h-3" /> Score
              </button>
              <button onClick={() => toggleSort('roi')} className={`flex items-center justify-center gap-1 px-2 py-2 rounded text-xs transition ${sortBy === 'roi' ? 'bg-[hsl(var(--primary))] text-black' : 'bg-[hsl(var(--muted))]'}`}>
                <TrendingUp className="w-3 h-3" /> ROI
              </button>
              <button onClick={() => toggleSort('liquidity')} className={`flex items-center justify-center gap-1 px-2 py-2 rounded text-xs transition ${sortBy === 'liquidity' ? 'bg-[hsl(var(--primary))] text-black' : 'bg-[hsl(var(--muted))]'}`}>
                <BarChart3 className="w-3 h-3" /> Liq
              </button>
              <button onClick={() => toggleSort('netProfit')} className={`flex items-center justify-center gap-1 px-2 py-2 rounded text-xs transition ${sortBy === 'netProfit' ? 'bg-[hsl(var(--primary))] text-black' : 'bg-[hsl(var(--muted))]'}`}>
                <Wallet className="w-3 h-3" /> Lucro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="bg-[hsl(var(--card))] rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[hsl(var(--primary))]" />
            Oportunidades de Arbitragem
            <span className="text-sm text-[hsl(var(--muted-foreground))]">{filteredOpportunities?.length ?? 0} encontradas</span>
          </h2>
        </div>
        {loading ? (
          <div className="p-10 text-center text-[hsl(var(--muted-foreground))]">Carregando...</div>
        ) : (filteredOpportunities?.length ?? 0) === 0 ? (
          <div className="p-10 text-center text-[hsl(var(--muted-foreground))]">Nenhuma oportunidade encontrada. Ajuste os filtros ou faça o seed dos dados primeiro.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--muted))]">
                <tr>
                  <th className="text-left px-4 py-3">
                    <Tooltip text="Nome da carta Pokémon TCG, obtido diretamente da API pokemontcg.io">
                      <span>Carta</span>
                    </Tooltip>
                  </th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">
                    <Tooltip text="Expansão/coleção a qual a carta pertence (ex: Base Set, Sword & Shield)">
                      <span>Set</span>
                    </Tooltip>
                  </th>
                  <th className="text-center px-4 py-3">
                    <Tooltip text="Graduação PSA (Professional Sports Authenticator). Escala de 1-10: PSA 10 (Gem Mint), PSA 9 (Mint), PSA 8 (NM-MT), PSA 7 (NM), PSA 6 (EX-MT), PSA 5 ou menor (EX). Cartas com maior graduação possuem maior valor de mercado.">
                      <span>PSA</span>
                    </Tooltip>
                  </th>
                  <th className="text-right px-4 py-3">
                    <Tooltip text="Preço de compra no marketplace com menor valor. Fonte: TCGplayer (USD) ou Cardmarket (EUR)">
                      <span>Compra</span>
                    </Tooltip>
                  </th>
                  <th className="text-right px-4 py-3">
                    <Tooltip text="Preço de venda no marketplace com maior valor. Fonte: TCGplayer (USD) ou Cardmarket (EUR)">
                      <span>Venda</span>
                    </Tooltip>
                  </th>
                  <th className="text-right px-4 py-3">
                    <Tooltip text="Lucro líquido após deduzir taxas (TCGplayer 10%, Cardmarket 5%) e frete ($5). Fórmula: (Venda × (1-taxa)) - (Compra × (1+taxa)) - Frete">
                      <span>Lucro</span>
                    </Tooltip>
                  </th>
                  <th className="text-center px-4 py-3">
                    <Tooltip text="Variação percentual do preço ao longo do tempo. Positivo indica tendência de alta, negativo indica queda. Calculado: (Preço Atual - Preço Anterior) / Preço Anterior × 100">
                      <span>Momentum</span>
                    </Tooltip>
                  </th>
                  <th className="text-center px-4 py-3">
                    <Tooltip text="Indicador de facilidade de compra/venda baseado na frequência de listagens e histórico de vendas. 70+: Alta liquidez, 40-69: Média, <40: Baixa">
                      <span>Liquidez</span>
                    </Tooltip>
                  </th>
                  <th className="text-center px-4 py-3">
                    <Tooltip text="Score composto (0-100) que combina: ROI (35%), Lucro (25%), Momentum (20%) e Spread (20%). Quanto maior, melhor a oportunidade">
                      <span>Score</span>
                    </Tooltip>
                  </th>
                  <th className="text-right px-4 py-3">
                    <Tooltip text="Retorno sobre Investimento. Fórmula: (Lucro Líquido / Custo Total) × 100. Considera taxas e frete no cálculo">
                      <span>ROI</span>
                    </Tooltip>
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOpportunities?.map((opp) => (
                  <tr key={opp?.cardId} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {opp?.imageSmall && (
                          <div className="w-10 h-14 relative rounded overflow-hidden bg-[hsl(var(--muted))] flex-shrink-0">
                            <Image src={opp?.imageSmall ?? ''} alt={opp?.cardName ?? 'Card'} fill className="object-contain" sizes="40px" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium">{opp?.cardName}</span>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">{opp?.rarity ?? ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-[hsl(var(--muted-foreground))]">{opp?.setName}</td>
                    <td className="px-4 py-3 text-center">
                      <PSABadge grade={opp?.psaGrade} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {opp?.buyCurrency === 'EUR' ? <Euro className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                        {(opp?.buyPrice ?? 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{opp?.buySource}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {opp?.sellCurrency === 'EUR' ? <Euro className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                        {(opp?.sellPrice ?? 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{opp?.sellSource}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${(opp?.netProfit ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${(opp?.netProfit ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <MomentumBadge momentum={opp?.momentum} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <LiquidityBar liquidity={opp?.liquidity} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={opp?.opportunityScore} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${(opp?.roi ?? 0) > 20 ? 'text-green-400' : (opp?.roi ?? 0) > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {(opp?.roi ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/cards/${opp?.cardId}`} className="p-2 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--primary))] hover:text-black transition inline-flex">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
