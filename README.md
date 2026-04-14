# Cinefilos LG

Aplicativo privado de gerenciamento de filmes para dois — migrado de React Native/Expo para Next.js PWA.

## Stack

| Camada         | Tecnologia                               |
|----------------|------------------------------------------|
| Framework      | Next.js 16.2.3 (App Router)              |
| UI             | Tailwind CSS 4 + Framer Motion 12        |
| Autenticação   | Supabase Auth                            |
| Banco de dados | Supabase (PostgreSQL + Realtime)         |
| Filmes         | TMDB API                                 |
| Deploy         | Vercel                                   |

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Gerar ícones PWA (necessário uma vez após clone)
node scripts/gen-icons.mjs

# 3. Criar arquivo de variáveis de ambiente
cp .env.example .env.local
# Preencher as variáveis (ver abaixo)

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

## Variáveis de ambiente

Crie `.env.local` na raiz com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
NEXT_PUBLIC_TMDB_API_KEY=sua_tmdb_api_key_aqui
```

- **Supabase**: crie um projeto em supabase.com → Settings → API.
- **TMDB**: themoviedb.org → Settings → API → Request API Key.

## Como fazer deploy na Vercel

```bash
# Opção 1: push para o repositório (deploy automático)
git push origin main

# Opção 2: deploy manual via CLI
npx vercel --prod
```

Configure as mesmas variáveis no painel da Vercel (Settings → Environment Variables).

## Como instalar como PWA

### iPhone (Safari)
1. Abra o app no Safari
2. Toque no ícone de **Compartilhar** (quadrado com seta)
3. Role e toque em **"Adicionar à Tela de Início"**
4. Confirme tocando em **"Adicionar"**

### Android (Chrome)
1. Abra o app no Chrome
2. Toque nos três pontos no canto superior direito
3. Toque em **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Confirme

O app roda em modo standalone sem barra do navegador, com ícone na tela inicial.

## Estrutura do projeto

```
src/
  app/
    (app)/           # Páginas autenticadas (header + tab bar)
      para-assistir/
      assistidos/
      busca/
      notificacoes/
      configuracoes/
    login/           # Tela de login
    layout.tsx       # Root layout (providers + splash)
  components/
    layout/          # AppHeader, BottomTabBar, UserAvatar, ProfileMenu
    movies/          # Cards e modais de filmes
    notifications/   # NotificationBanner, NotificationCard
    settings/        # EditNameModal
    ui/              # Button, Modal, Input, StarRating, Skeleton, etc.
  providers/         # AuthProvider, ThemeProvider, RealtimeProvider
  hooks/             # useMovies, useNotifications, etc.
  lib/supabase/      # Cliente Supabase (browser + server + middleware)
  theme/             # Paletas de cores e animações
  types/             # Types TypeScript compartilhados
public/
  sw.js              # Service Worker (cache-first para assets e TMDB)
  manifest.json      # Web App Manifest
  icon-192.png       # Ícone PWA 192x192
  icon-512.png       # Ícone PWA 512x512
  apple-touch-icon.png  # Ícone iOS 180x180
  favicon.ico        # Favicon
```

## Scripts

```bash
npm run dev                  # Servidor de desenvolvimento
npm run build                # Build de produção
npm run start                # Serve o build de produção
npm run lint                 # Linting com ESLint
node scripts/gen-icons.mjs   # Regenerar ícones PWA
```
