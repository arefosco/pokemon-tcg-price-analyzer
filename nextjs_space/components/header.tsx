'use client';

import Link from 'next/link';
import { Zap, Database, LayoutDashboard, Settings, Heart, Layers, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface SeedProgress {
  active: boolean;
  current: number;
  total: number;
  percent: number;
  currentSet: string;
  totalCards: number;
}

export default function Header() {
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  const [progress, setProgress] = useState<SeedProgress | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const checkProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/seed/status');
      const data = await res.json();
      if (data?.active) {
        setProgress(data);
        setShowProgress(true);
      } else {
        setProgress(null);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    checkProgress();
    const interval = setInterval(checkProgress, 2000);
    return () => clearInterval(interval);
  }, [checkProgress]);

  const handleSeed = async (reset = false) => {
    setSeeding(true);
    setSeedMessage('');
    setShowProgress(true);
    try {
      const res = await fetch(`/api/seed${reset ? '?reset=true' : ''}`, { method: 'POST' });
      const data = await res.json();
      setSeedMessage(data?.message ?? 'Seeded!');
      setProgress(null);
      if (res.ok && !data.isComplete) {
        // Auto-continue after 2 seconds
        setTimeout(() => handleSeed(), 2000);
      } else if (res.ok && data.isComplete) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setSeedMessage('Failed to seed');
      setProgress(null);
      setSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[hsl(var(--card))]/90 backdrop-blur border-b border-[hsl(var(--border))]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <Zap className="w-6 h-6 text-[hsl(var(--primary))]" />
          <span className="font-bold text-lg">TCG Analyzer</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link
            href="/sets"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition text-sm"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Coleções</span>
          </Link>
          <Link
            href="/watchlist"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm"
          >
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Watchlist</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition text-sm"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSeed(false)}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[hsl(var(--secondary))] text-white hover:opacity-90 transition text-sm disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">{seeding ? 'Carregando...' : 'Carregar'}</span>
            </button>
            <button
              onClick={() => handleSeed(true)}
              disabled={seeding}
              className="px-2 py-1.5 rounded bg-orange-600 text-white hover:bg-orange-700 transition text-xs disabled:opacity-50"
              title="Resetar e carregar do início"
            >
              ↻
            </button>
          </div>
          {seedMessage && <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:inline">{seedMessage}</span>}
        </div>
      </div>

      {/* Progress Card below Seed button */}
      {showProgress && progress && (
        <div className="absolute top-full right-4 mt-2 z-50 w-80 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[hsl(var(--primary))] animate-pulse" />
              <span className="font-semibold text-sm">Carregando Banco de Dados</span>
            </div>
            <button onClick={() => setShowProgress(false)} className="text-[hsl(var(--muted-foreground))] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
              <span>Coleção {progress.current} de {progress.total}</span>
              <span className="font-bold text-[hsl(var(--primary))]">{progress.percent}%</span>
            </div>
            
            <div className="w-full bg-[hsl(var(--muted))] rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              <p className="truncate">Processando: <span className="text-white">{progress.currentSet}</span></p>
              <p className="mt-1">Cartas importadas: <span className="text-green-400 font-semibold">{progress.totalCards.toLocaleString()}</span></p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
