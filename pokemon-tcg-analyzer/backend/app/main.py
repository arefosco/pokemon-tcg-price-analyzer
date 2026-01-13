from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import cards, opportunities

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pokemon TCG Analyzer API",
    description="API for analyzing Pokemon TCG card prices and arbitrage opportunities",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cards.router)
app.include_router(opportunities.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "pokemon-tcg-analyzer"}

@app.get("/")
def root():
    return {"message": "Pokemon TCG Analyzer API", "docs": "/docs"}
