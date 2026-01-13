'use client'

import { useEffect, useState } from 'react'
import { Card, fetchCards } from '@/lib/api'

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadData()
  }, [page, search])

  async function loadData() {
    setLoading(true)
    try {
      const data = await fetchCards({ page, limit: 24, search: search || undefined })
      setCards(data.items)
      setTotalPages(data.pages)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Card Explorer</h1>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="bg-gray-800 border border-gray-600 rounded px-4 py-2 w-full max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No cards found.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {cards.map((card) => (
              <a key={card.id} href={`/cards/${card.id}`} className="bg-gray-800 rounded-lg p-2 hover:ring-2 ring-yellow-400 transition">
                {card.image_small && (
                  <img src={card.image_small} alt={card.name} className="w-full" />
                )}
                <p className="text-sm mt-2 truncate">{card.name}</p>
                <p className="text-xs text-gray-400">{card.rarity || 'Unknown'}</p>
              </a>
            ))}
          </div>
          
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="py-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
