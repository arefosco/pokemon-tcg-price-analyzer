# 🎴 Pokemon TCG Analyzer

A web application for analyzing Pokemon TCG card prices and identifying arbitrage opportunities between TCGplayer (USD) and Cardmarket (EUR).

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone and enter directory
cd pokemon-tcg-analyzer

# Start all services
docker compose up --build

# In another terminal, seed the database
docker compose exec backend python seed.py
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 🪟 Executando no Windows 11

#### Pré-requisitos
- **Docker Desktop para Windows** - [Download](https://docs.docker.com/desktop/install/windows-install/)
  - Habilite WSL 2 durante a instalação
  - Após instalar, abra o Docker Desktop e aguarde inicializar

#### Passo a Passo

**Opção 1: Usando os scripts .bat (mais simples)**
```cmd
# Abra o CMD ou PowerShell na pasta do projeto
start.bat           # Inicia todos os serviços
seed.bat            # Popula o banco (em outro terminal)
```

**Opção 2: Comandos manuais (CMD)**
```cmd
cd pokemon-tcg-analyzer
docker compose up --build

# Em outro terminal
docker compose exec backend python seed.py
```

**Opção 3: Comandos manuais (PowerShell)**
```powershell
cd pokemon-tcg-analyzer
docker compose up --build

# Em outro terminal
docker compose exec backend python seed.py
```

#### Troubleshooting Windows

| Problema | Solução |
|----------|---------|
| `docker: command not found` | Reinicie o terminal após instalar Docker Desktop |
| Docker Desktop não inicia | Verifique se WSL 2 está habilitado: `wsl --install` |
| Portas em uso | Feche outros serviços usando portas 3000, 8000, 5432 |
| Erro de permissão | Execute CMD/PowerShell como Administrador |
| `docker compose` não funciona | Use `docker-compose` (com hífen) em versões antigas |
| Lentidão no WSL | Aumente memória em `.wslconfig` no diretório `%USERPROFILE%` |

#### Configuração WSL (opcional para melhor performance)
Crie arquivo `%USERPROFILE%\.wslconfig`:
```ini
[wsl2]
memory=4GB
processors=2
```

### Manual Development Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set DATABASE_URL for local postgres
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pokemon_tcg

uvicorn app.main:app --reload
python seed.py  # Populate data
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
pokemon-tcg-analyzer/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # DB connection
│   │   └── routers/         # API endpoints
│   ├── seed.py              # Data seeding script
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # React components
│   │   └── lib/api.ts       # API client
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/pokemon_tcg` |
| `POKEMONTCG_API_KEY` | API key for pokemontcg.io (optional, increases rate limits) | - |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend | `http://localhost:8000` |

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/cards` | GET | List cards (paginated, filterable) |
| `/cards/{id}` | GET | Card detail with prices |
| `/opportunities` | GET | Arbitrage opportunities with ROI/spread |

---

# 📋 BACKLOG - Features Not Implemented

## High Priority
- [ ] **AI Chatbox** - Natural language queries ("show me Charizard cards under $50")
- [ ] **Price Alerts** - Email/push notifications when ROI threshold met
- [ ] **Continuous Ingestion** - Scheduled price updates (cron/celery)
- [ ] **SSE Real-time Updates** - Server-sent events for live price changes

## Medium Priority
- [ ] **Momentum Indicator** - Price trend analysis (rising/falling/stable)
- [ ] **Advanced Opportunity Score** - Multi-factor scoring (liquidity, volume, trend)
- [ ] **Settings Page** - User preferences (currency, alert thresholds, favorite sets)
- [ ] **Watchlist** - Track specific cards
- [ ] **Portfolio Tracker** - Track owned cards and total value

## Lower Priority
- [ ] **Price History Charts** - Visual price trends over time
- [ ] **Bulk Analysis** - CSV upload for batch card analysis
- [ ] **Mobile App** - React Native version
- [ ] **Authentication** - User accounts and saved preferences
- [ ] **Export Reports** - PDF/CSV export of opportunities
- [ ] **Multi-marketplace** - Add eBay, Amazon, etc.
- [ ] **TCG-specific filters** - HP, attack damage, weakness, etc.

---

# 🎯 PIPELINE DE PRIORIZAÇÃO

## Critérios de Priorização

| Critério | Peso | Descrição |
|----------|------|-----------|
| **Valor para Usuário** | 40% | Impacto direto na experiência e utilidade |
| **Esforço de Implementação** | 30% | Tempo e complexidade técnica |
| **Dependências Técnicas** | 20% | Requisitos de infraestrutura |
| **Risco** | 10% | Probabilidade de problemas |

## Matriz Valor x Esforço

```
ALTO VALOR
    │
    │  ★ Price Alerts      ★ AI Chatbox
    │  ★ Continuous Ingest
    │
    │  ★ Momentum          ★ Advanced Score
    │  ★ Settings Page
    │
    │  ★ Watchlist         ★ Charts
    │  ★ Portfolio
    │
BAIXO VALOR
    └─────────────────────────────────────────
         BAIXO ESFORÇO          ALTO ESFORÇO
```

**Prioridade:** Quick Wins (alto valor, baixo esforço) → Strategic (alto valor, alto esforço) → Fill-ins → Deprioritize

---

# 📅 SPRINTS PLANEJADAS

## Sprint 1 (Atual) ✅ - MVP Foundation
**Objetivo:** Aplicação funcional básica

- [x] Backend FastAPI com endpoints CRUD
- [x] Modelos SQLAlchemy (Card, Set, PriceSnapshot)
- [x] Cálculo de ROI e Spread
- [x] Frontend Next.js com tabela de oportunidades
- [x] Página de detalhe da carta
- [x] Docker Compose funcional
- [x] Seed script para pokemontcg.io

---

## Sprint 2 - Data Automation & Alerts
**Objetivo:** Dados atualizados e notificações
**Duração:** 2 semanas

### Features:
1. **Continuous Ingestion**
   - Celery + Redis para tarefas agendadas
   - Job para atualizar preços a cada 6h
   - Rate limiting inteligente para API
   
2. **Price Alerts (Basic)**
   - Modelo Alert (card_id, threshold_roi, email)
   - Endpoint POST /alerts, GET /alerts
   - Email via SendGrid/SES quando threshold atingido

3. **Settings Page (Basic)**
   - Preferência de moeda (USD/EUR/BRL)
   - Threshold de ROI padrão para filtros

### Entregáveis:
- `backend/app/tasks/` - Celery tasks
- `backend/app/routers/alerts.py`
- `frontend/src/app/settings/page.tsx`
- `docker-compose.yml` atualizado com Redis

---

## Sprint 3 - Analytics & Intelligence
**Objetivo:** Insights avançados
**Duração:** 2 semanas

### Features:
1. **Momentum Indicator**
   - Comparar snapshots (7d, 30d)
   - Campo calculado: momentum = (price_now - price_7d) / price_7d
   - Badges: 🔥 Rising, 📉 Falling, ➡️ Stable
   
2. **Advanced Opportunity Score**
   - Score = ROI×0.4 + Momentum×0.3 + Volume×0.2 + Liquidity×0.1
   - Endpoint GET /opportunities?score_min=70
   
3. **Price History Charts**
   - Chart.js / Recharts no frontend
   - Endpoint GET /cards/{id}/history?days=30

### Entregáveis:
- `backend/app/services/analytics.py`
- `frontend/src/components/PriceChart.tsx`
- Atualizar Card Detail com gráfico

---

## Sprint 4 - User Experience
**Objetivo:** Personalização e engajamento
**Duração:** 2 semanas

### Features:
1. **Watchlist**
   - Modelo Watchlist (user_id, card_id)
   - Botão "Add to Watchlist" em cada carta
   - Página /watchlist com cartas favoritas
   
2. **Portfolio Tracker**
   - Modelo Portfolio (card_id, quantity, purchase_price)
   - Dashboard com valor total, P&L
   
3. **Authentication**
   - NextAuth.js com Google/GitHub
   - Protected routes para watchlist/portfolio

### Entregáveis:
- `backend/app/routers/users.py`
- `frontend/src/app/watchlist/page.tsx`
- `frontend/src/app/portfolio/page.tsx`

---

## Sprint 5 - AI & Real-time
**Objetivo:** Features avançadas
**Duração:** 3 semanas

### Features:
1. **AI Chatbox**
   - OpenAI GPT-4 integration
   - Natural language queries
   - Context-aware responses com dados do DB
   
2. **SSE Real-time Updates**
   - FastAPI SSE endpoint
   - Frontend EventSource listener
   - Live price updates na tabela
   
3. **Export Reports**
   - PDF generation (ReportLab)
   - CSV export dos opportunities

### Entregáveis:
- `backend/app/routers/chat.py`
- `backend/app/services/llm.py`
- `frontend/src/components/Chatbox.tsx`
- `backend/app/routers/export.py`

---

## Roadmap Visual

```
Q1 2026
├── Sprint 1 ✅ MVP Foundation
├── Sprint 2 → Data Automation & Alerts
└── Sprint 3 → Analytics & Intelligence

Q2 2026
├── Sprint 4 → User Experience  
├── Sprint 5 → AI & Real-time
└── Sprint 6 → Mobile & Scale (TBD)
```

---

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request
