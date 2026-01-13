'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, CreditCard, ChevronDown } from 'lucide-react';

interface SetWithCount {
  id: string;
  name: string;
  series: string | null;
  releaseDate: string | null;
  _count: { cards: number };
}

interface SetsGridProps {
  initialSets: SetWithCount[];
}

function formatReleaseDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const [year, month] = dateStr.split('/').length > 1 ? dateStr.split('/') : dateStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const m = parseInt(month, 10);
  return `${months[m - 1] || month}/${year}`;
}

const ITEMS_PER_PAGE = 24;

export default function SetsGrid({ initialSets }: SetsGridProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  
  const visibleSets = initialSets.slice(0, visibleCount);
  const hasMore = visibleCount < initialSets.length;
  const remaining = initialSets.length - visibleCount;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleSets.map((set) => (
          <Link
            key={set.id}
            href={`/sets/${set.id}`}
            className="bg-[hsl(var(--card))] rounded-lg p-4 border border-[hsl(var(--border))] hover:border-purple-500/50 transition group"
          >
            <h2 className="font-semibold text-lg group-hover:text-purple-400 transition">{set.name}</h2>
            {set.series && <p className="text-sm text-[hsl(var(--muted-foreground))]">{set.series}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatReleaseDate(set.releaseDate)}
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                {set._count.cards} cartas
              </span>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            <ChevronDown className="w-5 h-5" />
            Carregar mais ({remaining} restantes)
          </button>
        </div>
      )}
    </>
  );
}
