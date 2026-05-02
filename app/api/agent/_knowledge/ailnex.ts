export const AILNEX_KNOWLEDGE = `
# Ailnex Company Knowledge Base

## О компании
Ailnex — AI automation agency. Строит AI агентов которые делают работу за людей.
Pricing за результат (outcome-based), не per-seat. Нишевые продукты: B2B SaaS, AI assistants, automation.
Рынок: глобальный (английский) + Чехия (чешский/русский). Продажи только онлайн (SEO, Reddit, Product Hunt).

## Продукты которые уже построены

### InvoicePilot
- URL: https://invoicepilot-black.vercel.app
- Суть: AI генерирует 3 follow-up письма по неоплаченному инвойсу для фрилансеров
- Stack: Next.js 15 App Router + Supabase Auth + Claude Haiku + Stripe
- Паттерн: paste invoice details → AI генерирует 3 варианта → пользователь копирует лучший
- Цена: $39/мес

### ReviewAgent
- Суть: AI генерирует ответы на Google/Yelp отзывы для ресторанов, салонов, кофеен
- Stack: копия InvoicePilot (Next.js 15 + Supabase Auth + Claude Haiku + Stripe)
- Паттерн: paste review → AI генерирует ответ → владелец копирует в Google
- Цена: $49/мес

### Reception AI (reception-ai.cz)
- Суть: AI reception бот для салонов красоты Праги — отвечает на вопросы, принимает бронирование
- Stack: n8n workflow + Telegram Bot + SimplyBook API
- Паттерн: клиент пишет в Telegram → AI Tereza отвечает → booking через SimplyBook

### ContractAgent
- Статус: заморожен (долгий B2B цикл, CFO труднодоступны онлайн)

## Технологический стек (production-проверенный)

### Frontend
- Next.js 15 App Router (не Pages Router)
- TypeScript (строгий режим)
- Tailwind CSS (inline классы, не CSS modules)
- Lucide React (иконки — единственная allowed UI lib)

### Backend
- Supabase — PostgreSQL + RLS + Auth (email/password + OAuth)
- Next.js API Routes (app/api/[endpoint]/route.ts)
- Vercel serverless (бесплатный тир, timeout 60s)

### AI
- Claude API (Anthropic SDK)
- claude-haiku-4-5 — для рутинных задач (дёшево, быстро)
- claude-sonnet-4-6 — для анализа и генерации кода (баланс)
- claude-opus-4-7 — для сложных решений (дорого, только когда нужно)

### Payments
- Stripe (Checkout Sessions + Webhooks)

### Notifications
- Telegram Bot API (все уведомления агентов)

### Email
- Resend

### Hosting
- Vercel (все Next.js продукты — бесплатный тир)

### Automation Platforms
- n8n (self-hosted) — сложные multi-step workflows
- Make.com — простые интеграции, webhook-based

### Media Generation
- fal.ai — image и video generation

## N8N Workflows (что уже построено и работает)

### ailnex-sales pipeline (4 workflow)
- Lead Hunter: Apify scraper → данные компаний → Supabase
- Outreach Agent: Claude → персонализированный email → Resend
- Follow-up Agent: проверка ответов → повторный follow-up через N дней
- Паттерн: state machine через n8n variables

### ailnex-instagram (3 workflow)
- Instagram Generator: AI Researcher → AI Copywriter → captions + hashtags
- Instagram Publisher: Telegram approval → fal.ai image → Instagram Graph API
- Паттерн: Human-in-the-loop через Telegram inline buttons

### reception-ai (4 workflow)
- Prague Salon Scraper: сбор контактов салонов через Apify
- Tereza booking bot: Telegram → Claude → SimplyBook API
- Паттерн: Webhook → AI → External API

### veo-factory (видеопродакшн, 18 workflow)
- Shorts Generator, ASMR Generator, Video Generator POV
- Copywriting Agent (HTML + Markdown output)
- Image Gen Agent (fal.ai), Logo Animator
- Ad Creator, Seedance Video Generator
- Research Team (YT Researcher + INST Researcher)
- Паттерн: multi-agent pipeline с промежуточным хранением в Supabase

## N8N паттерны (используем активно)
- Multi-agent: AI Researcher → AI Writer → Publisher
- Polling loop: Check status → Wait 30s → Check again (до N раз)
- Human-in-the-loop: Telegram inline buttons → ждать Webhook callback
- RAG: Supabase vector store → pg_vector поиск
- State machine: n8n variables для отслеживания прогресса воркфлоу

## N8N ноды которые реально используем
HTTP Request, Set, If, Code (JavaScript), Telegram, Supabase, Wait,
Schedule Trigger, Webhook, Merge, Loop Over Items, AI Agent (LangChain),
OpenAI, Anthropic, Resend, Google Sheets

## Make.com паттерны (что использовали)
- Webhook → HTTP Request → Telegram (simple notifications)
- SimplyBook API: создание/изменение броней
- Custom GPT прокси через api.ailnex.com (Vercel proxy для CORS)
- Паттерн: простые линейные интеграции (не для сложной логики)

## Бизнес правила
- Бюджет: бесплатные тиры всего (Vercel free, Supabase free, n8n self-hosted)
- Delivery: MVP за 7-14 дней максимум
- Цены: $39-$99/мес за один продукт
- Продажи: никаких личных продаж — только онлайн (Reddit, SEO, Product Hunt, Indie Hackers)
- Код: минималистичный, без over-engineering, максимум 8 файлов на MVP

## Цветовая схема
- Ailnex бренд: #6366F1 (индиго) + тёмный фон (#0A0A0F)
- Builder-генерируемые сайты: #00e5ff (циановый акцент) + #0a0a0f фон + #111118 поверхности

## Запрещённые зависимости (каждая ломает билд или является overkill)
framer-motion, @radix-ui (все пакеты), shadcn/ui, react-hook-form, zod, next-intl,
@vercel/analytics, @supabase/supabase-js (в клиентском Builder коде)
`
