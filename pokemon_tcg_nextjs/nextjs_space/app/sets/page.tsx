import Header from '@/components/header';
import { prisma } from '@/lib/db';
import { Layers } from 'lucide-react';
import SetsGrid from '@/components/sets-grid';

// ISR: Revalida a cada 1 hora - evita consultas constantes ao banco
export const revalidate = 3600;

export default async function SetsPage() {
  // Busca apenas uma vez e fica em cache por 1 hora
  const sets = await prisma.set.findMany({
    orderBy: { releaseDate: 'desc' },
    include: { _count: { select: { cards: true } } },
  });

  const totalCards = await prisma.card.count();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Layers className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold">Coleções Pokémon TCG</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {sets.length} coleções • {totalCards.toLocaleString()} cartas
              </p>
            </div>
          </div>
        </div>

        <SetsGrid initialSets={sets} />

        {sets.length === 0 && (
          <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
            Nenhuma coleção encontrada. Execute o Seed para popular o banco.
          </div>
        )}
      </main>
    </div>
  );
}
