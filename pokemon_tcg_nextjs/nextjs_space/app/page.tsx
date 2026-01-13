import { Suspense } from 'react';
import Dashboard from '@/components/dashboard';
import Header from '@/components/header';

export default function Home() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Pokemon TCG <span className="text-[hsl(var(--primary))]">Price Analyzer</span>
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Find arbitrage opportunities between TCGplayer (USD) and Cardmarket (EUR)
          </p>
        </div>
        <Suspense fallback={<div className="text-center py-10">Loading opportunities...</div>}>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}
