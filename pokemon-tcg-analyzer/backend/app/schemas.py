from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SetSchema(BaseModel):
    id: str
    name: str
    series: Optional[str] = None
    release_date: Optional[str] = None
    total_cards: Optional[int] = None
    logo_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class PriceSnapshotSchema(BaseModel):
    id: int
    tcgplayer_market: Optional[float] = None
    tcgplayer_low: Optional[float] = None
    cardmarket_avg: Optional[float] = None
    cardmarket_trend: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class CardSchema(BaseModel):
    id: str
    name: str
    supertype: Optional[str] = None
    subtypes: Optional[str] = None
    rarity: Optional[str] = None
    number: Optional[str] = None
    image_small: Optional[str] = None
    image_large: Optional[str] = None
    set_id: Optional[str] = None
    set: Optional[SetSchema] = None
    
    class Config:
        from_attributes = True

class CardDetailSchema(CardSchema):
    price_snapshots: List[PriceSnapshotSchema] = []

class OpportunitySchema(BaseModel):
    card_id: str
    card_name: str
    set_name: str
    rarity: Optional[str]
    image_small: Optional[str]
    tcgplayer_usd: Optional[float]
    cardmarket_eur: Optional[float]
    cardmarket_usd: Optional[float]  # converted
    spread: Optional[float]
    roi_percent: Optional[float]
    direction: str  # 'buy_tcg_sell_cm' or 'buy_cm_sell_tcg'

class PaginatedCards(BaseModel):
    items: List[CardSchema]
    total: int
    page: int
    pages: int
