from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from ..database import get_db
from ..models import Card, PriceSnapshot
from ..schemas import OpportunitySchema

router = APIRouter(prefix="/opportunities", tags=["opportunities"])

EUR_TO_USD = 1.10  # Simplified exchange rate

def calculate_opportunity(card, latest_price) -> Optional[OpportunitySchema]:
    if not latest_price:
        return None
    
    tcg_usd = latest_price.tcgplayer_market
    cm_eur = latest_price.cardmarket_avg
    
    if not tcg_usd or not cm_eur:
        return None
    
    cm_usd = cm_eur * EUR_TO_USD
    
    # Calculate arbitrage opportunities
    if tcg_usd < cm_usd:
        # Buy TCGplayer, sell Cardmarket
        spread = cm_usd - tcg_usd
        roi = (spread / tcg_usd) * 100 if tcg_usd > 0 else 0
        direction = "buy_tcg_sell_cm"
    else:
        # Buy Cardmarket, sell TCGplayer
        spread = tcg_usd - cm_usd
        roi = (spread / cm_usd) * 100 if cm_usd > 0 else 0
        direction = "buy_cm_sell_tcg"
    
    return OpportunitySchema(
        card_id=card.id,
        card_name=card.name,
        set_name=card.set.name if card.set else "Unknown",
        rarity=card.rarity,
        image_small=card.image_small,
        tcgplayer_usd=tcg_usd,
        cardmarket_eur=cm_eur,
        cardmarket_usd=round(cm_usd, 2),
        spread=round(spread, 2),
        roi_percent=round(roi, 2),
        direction=direction
    )

@router.get("", response_model=List[OpportunitySchema])
def get_opportunities(
    min_roi: float = Query(0, ge=0),
    set_id: Optional[str] = None,
    rarity: Optional[str] = None,
    sort_by: str = Query("roi", enum=["roi", "spread", "price"]),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Card)
    
    if set_id:
        query = query.filter(Card.set_id == set_id)
    if rarity:
        query = query.filter(Card.rarity == rarity)
    
    cards = query.all()
    opportunities = []
    
    for card in cards:
        if card.price_snapshots:
            latest = card.price_snapshots[0]
            opp = calculate_opportunity(card, latest)
            if opp and opp.roi_percent >= min_roi:
                opportunities.append(opp)
    
    # Sort
    if sort_by == "roi":
        opportunities.sort(key=lambda x: x.roi_percent or 0, reverse=True)
    elif sort_by == "spread":
        opportunities.sort(key=lambda x: x.spread or 0, reverse=True)
    elif sort_by == "price":
        opportunities.sort(key=lambda x: x.tcgplayer_usd or 0, reverse=True)
    
    return opportunities[:limit]
