from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Set(Base):
    __tablename__ = "sets"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    series = Column(String)
    release_date = Column(String)
    total_cards = Column(Integer)
    logo_url = Column(String)
    symbol_url = Column(String)
    
    cards = relationship("Card", back_populates="set")

class Card(Base):
    __tablename__ = "cards"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    supertype = Column(String)
    subtypes = Column(String)
    hp = Column(String)
    types = Column(String)
    rarity = Column(String)
    number = Column(String)
    artist = Column(String)
    image_small = Column(String)
    image_large = Column(String)
    set_id = Column(String, ForeignKey("sets.id"))
    
    set = relationship("Set", back_populates="cards")
    price_snapshots = relationship("PriceSnapshot", back_populates="card", order_by="desc(PriceSnapshot.created_at)")

class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    card_id = Column(String, ForeignKey("cards.id"), nullable=False)
    tcgplayer_market = Column(Float)  # USD
    tcgplayer_low = Column(Float)
    tcgplayer_mid = Column(Float)
    tcgplayer_high = Column(Float)
    cardmarket_avg = Column(Float)  # EUR
    cardmarket_low = Column(Float)
    cardmarket_trend = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    card = relationship("Card", back_populates="price_snapshots")
