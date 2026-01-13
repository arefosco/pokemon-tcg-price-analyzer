export interface PTAXRate {
  currency: string;
  symbol: string;
  buyRate: number;
  sellRate: number;
  date: string;
}

export interface Opportunity {
  cardId: string;
  cardName: string;
  setName: string;
  rarity: string | null;
  imageSmall: string | null;
  buyPrice: number;
  buySource: string;
  buyCurrency: string;
  sellPrice: number;
  sellSource: string;
  sellCurrency: string;
  spread: number;
  netProfit: number;
  roi: number;
  fxRate: number;
  momentum?: number;
  opportunityScore?: number;
}
