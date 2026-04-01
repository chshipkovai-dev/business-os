# Business OS — Ailnex Internal Dashboard

## Что это
Внутренний дашборд компании Ailnex для управления задачами, 
проектами и бизнес-процессами.

## Stack
- Next.js 14 / TypeScript / Tailwind
- Supabase (auth, database)
- Telegram API (управление задачами через бота)

## Структура
- /app/(dashboard) — основной дашборд
- /app/api — API endpoints
- /app/waitlist — waitlist страница

## Статус
В разработке

## НЕ трогать
- /app/api/webhook — если есть Telegram webhook
