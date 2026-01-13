'use client'

import { useEffect, useState } from 'react'
import { Opportunity, fetchOpportunities } from '@/lib/api'

export default function HomePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [minRoi, setMinRoi] = useState(0)
  const [sortBy, setSortBy] = useState('roi')

  useEffect(() => {
    loadData()
  }, [minRoi, sortBy])

  async function loadData() {
    setLoading(true)
    try {
      const data = await fetchOpportunities({ min_roi: minRoi, sort_by: sortBy })
      setOpportunities(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Arbitrage Opportunities</h1>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Min ROI %</label>
          <input
            type="number"
            value={minRoi}
            onChange={(e) => setMinRoi(Number(e.target.value))}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 w-24"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
          >
            <option value="roi">ROI %</option>
            <option value="spread">Spread</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No opportunities found. Run seed.py to populate data.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">Card</th>
                <th className="px-4 py-3 text-left">Set</th>
                <th className="px-4 py-3 text-left">Rarity</th>
                <th className="px-4 py-3 text-right">TCGplayer</th>
                <th className="px-4 py-3 text-right">Cardmarket</th>
                <th className="px-4 py-3 text-right">Spread</th>
                <th className="px-4 py-3 text-right">ROI %</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.card_id} className="border-b border-gray-700 hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <a href={`/cards/${opp.card_id}`} className="flex items-center gap-2 hover:text-yellow-400">
                      {opp.image_small && (
                        <img src={opp.image_small} alt={opp.card_name} className="w-8 h-11 object-contain" />
                      )}
                      <span>{opp.card_name}</span>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{opp.set_name}</td>
                  <td className="px-4 py-3">{opp.rarity || '-'}</td>
                  <td className="px-4 py-3 text-right">${opp.tcgplayer_usd?.toFixed(2) || '-'}</td>
                  <td className="px-4 py-3 text-right">€{opp.cardmarket_eur?.toFixed(2) || '-'}</td>
                  <td className="px-4 py-3 text-right text-green-400">${opp.spread?.toFixed(2) || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={opp.roi_percent && opp.roi_percent > 10 ? 'text-green-400 font-bold' : ''}>
                      {opp.roi_percent?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {opp.direction === 'buy_tcg_sell_cm' ? 'Buy TCG → Sell CM' : 'Buy CM → Sell TCG'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
