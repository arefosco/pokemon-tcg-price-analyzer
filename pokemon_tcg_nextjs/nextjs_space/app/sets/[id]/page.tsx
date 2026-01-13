import Header from '@/components/header';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, Calendar, CreditCard } from 'lucide-react';
import { notFound } from 'next/navigation';
import CardsGrid from '@/components/cards-grid';

// ISR: Revalida a cada 1 hora (dados de cartas mudam apenas no seed)
export const revalidate = 3600;

function formatReleaseDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const [year, month] = dateStr.split('/').length > 1 ? dateStr.split('/') : dateStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const m = parseInt(month, 10);
  return `${months[m - 1] || month}/${year}`;
}

export default async function SetDetailPage({ params }: { params: { id: string } }) {
  const set = await prisma.set.findUnique({
    where: { id: params.id },
    include: { cards: { orderBy: { number: 'asc' } } },
  });

  if (!set) notFound();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/sets" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar às Coleções
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{set.name}</h1>
          {set.series && <p className="text-[hsl(var(--muted-foreground))]">{set.series}</p>}
          <div className="flex items-center gap-4 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatReleaseDate(set.releaseDate)}</span>
            <span className="flex items-center gap-1"><CreditCard className="w-4 h-4" /> {set.cards.length} cartas</span>
          </div>
        </div>

        <CardsGrid cards={set.cards} />
      </main>
    </div>
  );
}
