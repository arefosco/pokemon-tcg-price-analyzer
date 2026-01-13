from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from ..database import get_db
from ..models import Card, Set, PriceSnapshot
from ..schemas import CardSchema, CardDetailSchema, PaginatedCards

router = APIRouter(prefix="/cards", tags=["cards"])

@router.get("", response_model=PaginatedCards)
def get_cards(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    set_id: Optional[str] = None,
    rarity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Card)
    
    if set_id:
        query = query.filter(Card.set_id == set_id)
    if rarity:
        query = query.filter(Card.rarity == rarity)
    if search:
        query = query.filter(Card.name.ilike(f"%{search}%"))
    
    total = query.count()
    pages = (total + limit - 1) // limit
    items = query.offset((page - 1) * limit).limit(limit).all()
    
    return PaginatedCards(items=items, total=total, page=page, pages=pages)

@router.get("/{card_id}", response_model=CardDetailSchema)
def get_card(card_id: str, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card
