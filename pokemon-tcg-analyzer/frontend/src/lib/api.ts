const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Opportunity {
  card_id: string
  card_name: string
  set_name: string
  rarity: string | null
  image_small: string | null
  tcgplayer_usd: number | null
  cardmarket_eur: number | null
  cardmarket_usd: number | null
  spread: number | null
  roi_percent: number | null
  direction: string
}

export interface Card {
  id: string
  name: string
  supertype: string | null
  subtypes: string | null
  rarity: string | null
  number: string | null
  image_small: string | null
  image_large: string | null
  set_id: string | null
  set?: { id: string; name: string }
  price_snapshots?: PriceSnapshot[]
}

export interface PriceSnapshot {
  id: number
  tcgplayer_market: number | null
  tcgplayer_low: number | null
  cardmarket_avg: number | null
  cardmarket_trend: number | null
  created_at: string
}

export async function fetchOpportunities(params?: {
  min_roi?: number
  set_id?: string
  rarity?: string
  sort_by?: string
}): Promise<Opportunity[]> {
  const searchParams = new URLSearchParams()
  if (params?.min_roi) searchParams.set('min_roi', String(params.min_roi))
  if (params?.set_id) searchParams.set('set_id', params.set_id)
  if (params?.rarity) searchParams.set('rarity', params.rarity)
  if (params?.sort_by) searchParams.set('sort_by', params.sort_by)
  
  const res = await fetch(`${API_URL}/opportunities?${searchParams}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch opportunities')
  return res.json()
}

export async function fetchCard(id: string): Promise<Card> {
  const res = await fetch(`${API_URL}/cards/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch card')
  return res.json()
}

export async function fetchCards(params?: {
  page?: number
  limit?: number
  search?: string
  set_id?: string
  rarity?: string
}): Promise<{ items: Card[]; total: number; page: number; pages: number }> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.search) searchParams.set('search', params.search)
  if (params?.set_id) searchParams.set('set_id', params.set_id)
  if (params?.rarity) searchParams.set('rarity', params.rarity)
  
  const res = await fetch(`${API_URL}/cards?${searchParams}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch cards')
  return res.json()
}
