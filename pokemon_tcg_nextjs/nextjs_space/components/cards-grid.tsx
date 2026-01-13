'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

interface Card {
  id: string;
  name: string;
  number: string | null;
  rarity: string | null;
  imageSmall: string | null;
}

interface CardsGridProps {
  cards: Card[];
}

const ITEMS_PER_PAGE = 36;

export default function CardsGrid({ cards }: CardsGridProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  
  const visibleCards = cards.slice(0, visibleCount);
  const hasMore = visibleCount < cards.length;
  const remaining = cards.length - visibleCount;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {visibleCards.map((card) => (
          <Link
            key={card.id}
            href={`/cards/${card.id}`}
            className="bg-[hsl(var(--card))] rounded-lg p-2 border border-[hsl(var(--border))] hover:border-yellow-500/50 transition group"
          >
            <div className="relative aspect-[2.5/3.5] rounded overflow-hidden bg-[hsl(var(--muted))]">
              {card.imageSmall ? (
                <Image 
                  src={card.imageSmall} 
                  alt={card.name} 
                  fill 
                  className="object-contain group-hover:scale-105 transition" 
                  sizes="150px"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[hsl(var(--muted-foreground))]">Sem imagem</div>
              )}
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium truncate group-hover:text-yellow-400 transition">{card.name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{card.number} • {card.rarity}</p>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
          >
            <ChevronDown className="w-5 h-5" />
            Carregar mais ({remaining} restantes)
          </button>
        </div>
      )}
    </>
  );
}
