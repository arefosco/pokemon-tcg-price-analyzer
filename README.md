<div align="center">
  <img src="nextjs_space/public/favicon.svg" alt="Pokemon TCG Analyzer Logo" width="80" height="80">
  
  # Pokémon TCG Price Analyzer 🎴
  
  **Encontre oportunidades de arbitragem entre TCGplayer, Cardmarket e o mercado brasileiro**
  
  [![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.7-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

  [Demo](https://poketcg.abacusai.app) · [Reportar Bug](../../issues) · [Solicitar Feature](../../issues)

</div>

---

## 📋 Índice

- [Sobre](#-sobre)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API Reference](#-api-reference)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre

O **Pokémon TCG Price Analyzer** é uma ferramenta completa para colecionadores e traders que desejam identificar oportunidades de arbitragem no mercado de cartas Pokémon. 

A aplicação compara preços entre **TCGplayer** (EUA), **Cardmarket** (Europa) e calcula o lucro potencial considerando:

- ✅ Taxas de marketplace (TCGplayer 10%, Cardmarket 5%)
- ✅ Taxa de revenda no Brasil (Mercado Livre 12%)
- ✅ Frete internacional
- ✅ Cotação PTAX em tempo real (Banco Central)
- ✅ Preços de cartas gradadas PSA

---

## ✨ Features

### 📊 Dashboard Inteligente
- **Top 20 oportunidades** rankeadas por ROI líquido
- **Opportunity Score** baseado em ROI, lucro e momentum
- **Filtros avançados** por set, raridade e ROI mínimo
- **Exportação CSV** para análise externa

### 💱 Integração PTAX
- Cotações **USD, EUR e JPY** em tempo real
- Comparação com **média dos últimos 7 dias**
- **Alerta de importação** quando dólar cai X% da média
- Cálculo automático de economia por importação

### 🏆 Preços PSA
- Integração com **PokemonPriceTracker API**
- Preços para grades **PSA 6-10**
- Cálculo de ROI por grade
- Top 5 oportunidades PSA por carta

### 🔔 Sistema de Alertas
- Alertas personalizados por carta
- Notificação quando ROI atinge threshold
- Gerenciamento centralizado em Settings

### ⚙️ Configurações Flexíveis
- Taxas de compra (TCGplayer/Cardmarket)
- Taxa de venda (Marketplace BR)
- Frete internacional
- Thresholds de alerta

---

## 🛠 Tech Stack

| Categoria | Tecnologia |
|-----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Linguagem** | TypeScript 5.2 |
| **Database** | PostgreSQL + Prisma ORM |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **APIs** | Pokemon TCG API, PTAX BCB, PokemonPriceTracker |

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Yarn (recomendado)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/pokemon-tcg-analyzer.git
cd pokemon-tcg-analyzer

# 2. Instale as dependências
cd nextjs_space
yarn install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 4. Execute as migrations do banco
yarn prisma db push
yarn prisma generate

# 5. Inicie o servidor de desenvolvimento
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000) 🎉

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `nextjs_space`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pokemon_tcg"

# PokemonPriceTracker API (opcional, para preços PSA)
PRICETRACKER_API_KEY="sua_api_key"

# Google Analytics (opcional)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### Seed do Banco de Dados

Para popular o banco com dados das cartas:

```bash
# Via interface (recomendado)
# Acesse o app e clique no botão "Seed" no header

# Via API
curl -X POST http://localhost:3000/api/seed
```

> ⚠️ O seed processa ~170 sets e ~18.000 cartas em batches. Pode levar alguns minutos.

---

## 📖 Uso

### Buscar Oportunidades

1. Acesse o **Dashboard** na página inicial
2. Use os filtros para refinar por **set**, **raridade** ou **ROI mínimo**
3. Ordene por **Score**, **ROI**, **Lucro** ou **Liquidez**
4. Clique em uma carta para ver detalhes e histórico de preços

### Configurar Taxas

1. Acesse **Settings** no menu
2. Ajuste as taxas de compra (TCGplayer/Cardmarket)
3. Configure a **taxa do marketplace BR** (padrão 12%)
4. Defina o threshold do **alerta de importação**

### Criar Alertas

1. Acesse a página de detalhe de uma carta
2. Clique em "Criar Alerta"
3. Defina o ROI mínimo desejado
4. Receba notificações quando o threshold for atingido

---

## 📚 API Reference

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/opportunities` | Lista oportunidades de arbitragem |
| `POST` | `/api/opportunities/recalculate` | Recalcula cache de oportunidades |
| `GET` | `/api/cards` | Lista cartas com filtros |
| `GET` | `/api/cards/[id]` | Detalhes de uma carta |
| `GET` | `/api/sets` | Lista todas as coleções |
| `GET` | `/api/ptax` | Cotações PTAX atuais |
| `GET/PUT` | `/api/settings` | Configurações do sistema |
| `GET/POST/DELETE` | `/api/alerts` | Gerenciamento de alertas |
| `POST` | `/api/seed` | Popula banco de dados |

### Exemplo de Response

```json
// GET /api/opportunities
{
  "opportunities": [
    {
      "cardId": "sv6-123",
      "cardName": "Charizard ex",
      "setName": "Twilight Masquerade",
      "buyPrice": 45.99,
      "buySource": "tcgplayer",
      "sellPrice": 89.90,
      "sellSource": "cardmarket",
      "netProfit": 28.45,
      "roi": 61.8,
      "momentum": 5.2,
      "opportunityScore": 78,
      "liquidity": 0.85
    }
  ],
  "cacheUpdatedAt": "2024-01-13T12:00:00Z"
}
```

---

## 📁 Estrutura do Projeto

```
pokemon_tcg_nextjs/
└── nextjs_space/
    ├── app/
    │   ├── api/                 # API Routes
    │   │   ├── alerts/          # Gerenciamento de alertas
    │   │   ├── cards/           # CRUD de cartas
    │   │   ├── opportunities/   # Cálculo de oportunidades
    │   │   ├── ptax/            # Cotações BCB
    │   │   ├── seed/            # Seed do banco
    │   │   ├── sets/            # Coleções
    │   │   └── settings/        # Configurações
    │   ├── cards/[id]/          # Página de detalhe
    │   ├── sets/                # Página de coleções
    │   ├── settings/            # Página de configurações
    │   └── watchlist/           # Lista de observação
    ├── components/
    │   ├── ui/                  # Componentes base (shadcn)
    │   ├── dashboard.tsx        # Dashboard principal
    │   ├── card-detail.tsx      # Detalhe da carta
    │   └── header.tsx           # Header global
    ├── lib/
    │   ├── db.ts                # Cliente Prisma
    │   └── utils.ts             # Utilitários
    └── prisma/
        └── schema.prisma        # Schema do banco
```

---

## 🗺 Roadmap

- [x] Dashboard com oportunidades
- [x] Integração PTAX (BCB)
- [x] Preços PSA (PokemonPriceTracker)
- [x] Sistema de alertas
- [x] Taxa de marketplace BR
- [x] Alerta de oportunidade de importação
- [ ] Notificações por email
- [ ] Histórico de preços em BRL
- [ ] Integração com Mercado Livre API
- [ ] App mobile (React Native)
- [ ] Comparador de lojas brasileiras

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um **Fork** do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um **Pull Request**

### Padrões de Código

- Use **TypeScript** para todo código novo
- Siga o padrão de **naming em português** para UI
- Mantenha componentes **desacoplados** e reutilizáveis
- Adicione **testes** para novas features

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  
  **Feito com ❤️ para a comunidade Pokémon TCG Brasil**
  
  ⭐ Se este projeto te ajudou, deixe uma estrela!
  
</div>
