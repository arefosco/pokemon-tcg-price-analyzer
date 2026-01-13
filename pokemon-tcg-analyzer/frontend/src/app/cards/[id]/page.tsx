import { fetchCard } from '@/lib/api'
import { notFound } from 'next/navigation'

const EUR_TO_USD = 1.10

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  let card
  try {
    card = await fetchCard(params.id)
  } catch {
    notFound()
  }

  const latestPrice = card.price_snapshots?.[0]
  const tcgUsd = latestPrice?.tcgplayer_market
  const cmEur = latestPrice?.cardmarket_avg
  const cmUsd = cmEur ? cmEur * EUR_TO_USD : null
  
  let spread = null
  let roi = null
  let direction = ''
  
  if (tcgUsd && cmUsd) {
    if (tcgUsd < cmUsd) {
      spread = cmUsd - tcgUsd
      roi = (spread / tcgUsd) * 100
      direction = 'Buy TCGplayer → Sell Cardmarket'
    } else {
      spread = tcgUsd - cmUsd
      roi = (spread / cmUsd) * 100
      direction = 'Buy Cardmarket → Sell TCGplayer'
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        {card.image_large && (
          <img src={card.image_large} alt={card.name} className="w-full max-w-sm mx-auto rounded-lg shadow-xl" />
        )}
      </div>
      
      <div>
        <h1 className="text-3xl font-bold mb-2">{card.name}</h1>
        <p className="text-gray-400 mb-6">
          {card.set?.name} • #{card.number} • {card.rarity || 'Unknown Rarity'}
        </p>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Prices</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">TCGplayer (USD)</p>
              <p className="text-2xl font-bold">${tcgUsd?.toFixed(2) || 'N/A'}</p>
              {latestPrice?.tcgplayer_low && (
                <p className="text-xs text-gray-500">Low: ${latestPrice.tcgplayer_low.toFixed(2)}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-400">Cardmarket (EUR)</p>
              <p className="text-2xl font-bold">€{cmEur?.toFixed(2) || 'N/A'}</p>
              {cmUsd && <p className="text-xs text-gray-500">≈ ${cmUsd.toFixed(2)} USD</p>}
            </div>
          </div>
        </div>
        
        {spread !== null && roi !== null && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">Arbitrage Opportunity</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400">Spread</p>
                <p className="text-2xl font-bold text-green-400">${spread.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">ROI</p>
                <p className="text-2xl font-bold text-green-400">{roi.toFixed(1)}%</p>
              </div>
            </div>
            <p className="text-sm text-gray-300">💡 {direction}</p>
          </div>
        )}
        
        <div className="mt-6">
          <a href="/" className="text-yellow-400 hover:underline">← Back to Opportunities</a>
        </div>
      </div>
    </div>
  )
}
