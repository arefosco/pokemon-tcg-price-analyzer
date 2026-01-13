#!/usr/bin/env python3
"""Seed script to populate database with Pokemon TCG data from pokemontcg.io API"""
import httpx
import os
import sys
import time
from datetime import datetime

print(f"[{datetime.now()}] Starting seed.py...")
print(f"Python version: {sys.version}")

# Test imports
try:
    from sqlalchemy.orm import Session
    from sqlalchemy import text
    print("✓ SQLAlchemy imported successfully")
except ImportError as e:
    print(f"✗ SQLAlchemy import failed: {e}")
    sys.exit(1)

try:
    from app.database import engine, SessionLocal, Base
    from app.models import Set, Card, PriceSnapshot
    print("✓ App modules imported successfully")
except ImportError as e:
    print(f"✗ App module import failed: {e}")
    sys.exit(1)

API_URL = "https://api.pokemontcg.io/v2"
API_KEY = os.getenv("POKEMONTCG_API_KEY", "")

# Use only 1 small set for fast testing
SEED_SETS = [
    "swshp",   # Sword & Shield Promos (smaller)
]

print(f"API URL: {API_URL}")
print(f"API Key configured: {'Yes' if API_KEY else 'No (using without key)'}")
print(f"Sets to seed: {SEED_SETS}")

# Check DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/pokemon_tcg")
print(f"DATABASE_URL: {DATABASE_URL}")

def get_headers():
    headers = {"Content-Type": "application/json"}
    if API_KEY:
        headers["X-Api-Key"] = API_KEY
    return headers

def test_db_connection():
    """Test database connectivity"""
    print("\n--- Testing Database Connection ---")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ Database connection successful!")
            return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def test_api_connection():
    """Test API connectivity"""
    print("\n--- Testing API Connection ---")
    try:
        response = httpx.get(f"{API_URL}/sets", params={"pageSize": 1}, headers=get_headers(), timeout=30)
        print(f"API Response Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ API connection successful! Found {data.get('totalCount', '?')} total sets")
            return True
        else:
            print(f"✗ API returned error: {response.text[:200]}")
            return False
    except httpx.ConnectError as e:
        print(f"✗ API connection error: {e}")
        return False
    except Exception as e:
        print(f"✗ API error: {type(e).__name__}: {e}")
        return False

def fetch_set(set_id: str) -> dict:
    """Fetch set details from API"""
    print(f"  Fetching set info for: {set_id}")
    response = httpx.get(f"{API_URL}/sets/{set_id}", headers=get_headers(), timeout=30)
    print(f"  Set API response: {response.status_code}")
    response.raise_for_status()
    return response.json()["data"]

def fetch_cards_by_set(set_id: str, limit: int = 50) -> list:
    """Fetch cards from a set (limited for testing)"""
    print(f"  Fetching cards for set: {set_id} (limit: {limit})")
    response = httpx.get(
        f"{API_URL}/cards",
        params={"q": f"set.id:{set_id}", "page": 1, "pageSize": limit},
        headers=get_headers(),
        timeout=60
    )
    print(f"  Cards API response: {response.status_code}")
    response.raise_for_status()
    data = response.json()
    cards = data["data"]
    print(f"  Got {len(cards)} cards")
    return cards

def seed_set(db: Session, set_data: dict):
    """Insert or update a set"""
    existing = db.query(Set).filter(Set.id == set_data["id"]).first()
    if existing:
        print(f"  Set {set_data['id']} already exists, skipping")
        return existing
    
    db_set = Set(
        id=set_data["id"],
        name=set_data["name"],
        series=set_data.get("series"),
        release_date=set_data.get("releaseDate"),
        total_cards=set_data.get("total"),
        logo_url=set_data.get("images", {}).get("logo"),
        symbol_url=set_data.get("images", {}).get("symbol")
    )
    db.add(db_set)
    db.commit()
    print(f"  ✓ Set '{set_data['name']}' added to DB")
    return db_set

def seed_card(db: Session, card_data: dict):
    """Insert card with price snapshot"""
    card_id = card_data["id"]
    existing = db.query(Card).filter(Card.id == card_id).first()
    if existing:
        return existing
    
    subtypes = ",".join(card_data.get("subtypes", [])) if card_data.get("subtypes") else None
    types = ",".join(card_data.get("types", [])) if card_data.get("types") else None
    
    db_card = Card(
        id=card_id,
        name=card_data["name"],
        supertype=card_data.get("supertype"),
        subtypes=subtypes,
        hp=card_data.get("hp"),
        types=types,
        rarity=card_data.get("rarity"),
        number=card_data.get("number"),
        artist=card_data.get("artist"),
        image_small=card_data.get("images", {}).get("small"),
        image_large=card_data.get("images", {}).get("large"),
        set_id=card_data.get("set", {}).get("id")
    )
    db.add(db_card)
    db.commit()
    
    add_price_snapshot(db, db_card.id, card_data)
    return db_card

def add_price_snapshot(db: Session, card_id: str, card_data: dict):
    """Add price snapshot for a card"""
    tcgplayer = card_data.get("tcgplayer", {}).get("prices", {})
    cardmarket = card_data.get("cardmarket", {}).get("prices", {})
    
    tcg_prices = tcgplayer.get("holofoil") or tcgplayer.get("normal") or tcgplayer.get("reverseHolofoil") or {}
    
    snapshot = PriceSnapshot(
        card_id=card_id,
        tcgplayer_market=tcg_prices.get("market"),
        tcgplayer_low=tcg_prices.get("low"),
        tcgplayer_mid=tcg_prices.get("mid"),
        tcgplayer_high=tcg_prices.get("high"),
        cardmarket_avg=cardmarket.get("averageSellPrice"),
        cardmarket_low=cardmarket.get("lowPrice"),
        cardmarket_trend=cardmarket.get("trendPrice")
    )
    db.add(snapshot)
    db.commit()

def main():
    print("\n" + "="*50)
    print("POKEMON TCG DATABASE SEEDER")
    print("="*50)
    
    # Test connections first
    if not test_db_connection():
        print("\n❌ Cannot proceed without database connection!")
        sys.exit(1)
    
    if not test_api_connection():
        print("\n❌ Cannot proceed without API connection!")
        sys.exit(1)
    
    print("\n--- Creating Tables ---")
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Tables created/verified")
    except Exception as e:
        print(f"✗ Table creation failed: {e}")
        sys.exit(1)
    
    db = SessionLocal()
    
    try:
        for set_id in SEED_SETS:
            print(f"\n{'='*40}")
            print(f"Seeding set: {set_id}")
            print("="*40)
            
            try:
                set_data = fetch_set(set_id)
                seed_set(db, set_data)
                
                cards = fetch_cards_by_set(set_id, limit=50)  # Limit to 50 cards for testing
                
                for i, card_data in enumerate(cards):
                    seed_card(db, card_data)
                    if (i + 1) % 10 == 0:
                        print(f"  Processed {i + 1}/{len(cards)} cards")
                
                print(f"✓ Completed set: {set_data['name']}")
                time.sleep(1)
                
            except httpx.HTTPStatusError as e:
                print(f"✗ HTTP Error for set {set_id}: {e.response.status_code} - {e.response.text[:200]}")
                continue
            except Exception as e:
                print(f"✗ Error seeding set {set_id}: {type(e).__name__}: {e}")
                continue
        
        # Print summary
        total_sets = db.query(Set).count()
        total_cards = db.query(Card).count()
        total_prices = db.query(PriceSnapshot).count()
        
        print(f"\n{'='*50}")
        print("SEED COMPLETE")
        print("="*50)
        print(f"✓ Sets: {total_sets}")
        print(f"✓ Cards: {total_cards}")
        print(f"✓ Price Snapshots: {total_prices}")
        
        if total_cards == 0:
            print("\n⚠️ WARNING: No cards were inserted!")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
