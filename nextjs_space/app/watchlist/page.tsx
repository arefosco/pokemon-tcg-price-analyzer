'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/header';
import { Heart, Trash2, TrendingUp, DollarSign, Euro, ChevronRight, ArrowLeft } from 'lucide-react';

interface WatchlistItem {
  id: number;
  cardId: string;
  cardName: string;
  setName: string;
  rarity: string | null;
  imageSmall: string | null;
  tcgPrice: number;
  cmPrice: number;
  roi: number;
  notes: string | null;
  createdAt: string;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlist');
      const data = await res.json();
      setItems(data?.items ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (cardId: string) => {
    try {
      await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      setItems(items.filter((i) => i.cardId !== cardId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-white transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-8 h-8 text-red-500" />
          <h1 className="text-2xl font-bold">Minha Watchlist</h1>
          <span className="text-[hsl(var(--muted-foreground))]">{items.length} cartas</span>
        </div>

        {loading ? (
          <div className="text-center text-[hsl(var(--muted-foreground))] py-10">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="bg-[hsl(var(--card))] rounded-xl p-10 text-center">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sua watchlist est\u00e1 vazia</h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-4">Adicione cartas clicando no cora\u00e7\u00e3o na p\u00e1gina de detalhes</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] text-black px-4 py-2 rounded-lg hover:opacity-90 transition">
              Explorar Cartas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-[hsl(var(--card))] rounded-xl p-4 shadow-lg">
                <div className="flex gap-4">
                  {item.imageSmall && (
                    <div className="w-20 h-28 relative rounded overflow-hidden bg-[hsl(var(--muted))] flex-shrink-0">
                      <Image src={item.imageSmall} alt={item.cardName} fill className="object-contain" sizes="80px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.cardName}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] truncate">{item.setName}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.rarity}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-sm font-bold ${item.roi > 20 ? 'text-green-400' : item.roi > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        <TrendingUp className="w-3 h-3 inline" /> {item.roi.toFixed(1)}% ROI
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      <span><DollarSign className="w-3 h-3 inline" />{item.tcgPrice.toFixed(2)}</span>
                      <span><Euro className="w-3 h-3 inline" />{item.cmPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-[hsl(var(--border))]">
                  <button
                    onClick={() => handleRemove(item.cardId)}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Remover
                  </button>
                  <Link href={`/cards/${item.cardId}`} className="text-[hsl(var(--primary))] hover:underline text-sm flex items-center gap-1">
                    Ver Detalhes <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
