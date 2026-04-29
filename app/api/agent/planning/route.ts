import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function sendTelegramWithButtons(msg: string, reply_markup?: object) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML', reply_markup }),
  }).catch(() => {})
}

const PLANNING_PROMPT = `Ты — Senior Planning Agent компании ailnex. Получаешь задачу на разработку и делаешь ГЛУБОКИЙ анализ перед тем как передать разработчику.

Задача: {TITLE}
Детали: {NOTES}
Тип: {CATEGORY}
Репозиторий: {REPO}

Стек ailnex: Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase, Claude API, Vercel.

ВАЖНО по структуре файлов:
- pages: только чистые пути, например "app/page.tsx", "app/layout.tsx" — БЕЗ описания через " —"
- components: только чистые пути, например "components/ui/Button.tsx" — БЕЗ описания
- api_routes: только чистые пути, например "app/api/register/route.ts" — БЕЗ описания

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "project_name": "короткое название проекта",
  "github_repo": "{REPO}",
  "goal": "одно предложение — что именно строим и какую проблему решаем",
  "use_cases": [
    "Use case 1: кто + что делает + зачем",
    "Use case 2: кто + что делает + зачем",
    "Use case 3: кто + что делает + зачем"
  ],
  "user_flow": [
    "Шаг 1: пользователь делает X",
    "Шаг 2: система делает Y",
    "Шаг 3: пользователь видит Z"
  ],
  "structure": {
    "pages": ["app/layout.tsx", "app/page.tsx"],
    "components": ["components/ui/Button.tsx"],
    "api_routes": ["app/api/register/route.ts"],
    "db_tables": ["leads — id, email, plan, created_at"]
  },
  "tech_decisions": [
    "Решение 1: что используем и почему",
    "Решение 2: что используем и почему"
  ],
  "edge_cases": [
    "Edge case 1: что может пойти не так и как обработать",
    "Edge case 2: что может пойти не так и как обработать"
  ],
  "build_plan": [
    "День 1: конкретные задачи",
    "День 2: конкретные задачи",
    "День 3: конкретные задачи"
  ],
  "estimate_days": 3,
  "complexity": "low",
  "first_file": "app/layout.tsx"
}`

export async function POST(req: NextRequest) {
  const { task_id, title, notes, category } = await req.json()

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const repoMatch = notes?.match(/GITHUB_REPO:\s*([^\n]+)/)
  const repo = repoMatch ? repoMatch[1].trim() : 'chshipkovai-dev/business-os'

  const prompt = PLANNING_PROMPT
    .replace('{TITLE}', title)
    .replace('{NOTES}', notes || 'нет')
    .replace('{CATEGORY}', category || 'work')
    .replace('{REPO}', repo)
    .replace('{REPO}', repo)

  try {
    const response = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const text = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const plan = JSON.parse(text)
    plan.github_repo = repo

    const db = getDB()
    if (task_id) {
      await db.from('tasks').update({
        agent_status: 'planned',
        notes: `GITHUB_REPO: ${repo}\n[PLANNING AGENT]\n${JSON.stringify(plan, null, 2)}`,
      }).eq('id', task_id)
    }

    const complexityEmoji: Record<string, string> = { low: '🟢', medium: '🟡', high: '🔴' }
    const complexityLabel: Record<string, string> = { low: 'Низкая', medium: 'Средняя', high: 'Высокая' }

    const allFiles = [
      ...plan.structure.pages,
      ...plan.structure.components,
      ...plan.structure.api_routes,
    ]

    const msg = [
      `📋 <b>Planning Agent — план готов</b>`,
      ``,
      `<b>${plan.project_name}</b>`,
      `🎯 ${plan.goal}`,
      `📦 Репо: <code>${repo}</code>`,
      ``,
      `${complexityEmoji[plan.complexity] ?? '🟡'} Сложность: <b>${complexityLabel[plan.complexity] ?? plan.complexity}</b>`,
      `⏱ Оценка: <b>${plan.estimate_days} дней</b>`,
      ``,
      `<b>Use Cases:</b>`,
      ...plan.use_cases.map((uc: string) => `• ${uc}`),
      ``,
      `<b>Файлы (${allFiles.length}):</b>`,
      ...allFiles.map((f: string) => `• <code>${f}</code>`),
      ``,
      `<b>План разработки:</b>`,
      ...plan.build_plan.map((day: string) => `• ${day}`),
    ].join('\n')

    const keyboard = task_id ? {
      inline_keyboard: [[
        { text: '✅ Апрув — передать Builder', callback_data: `approve:${task_id}` },
        { text: '✏️ Нужны правки', callback_data: `revise:${task_id}` },
      ]]
    } : undefined

    await sendTelegramWithButtons(msg, keyboard)

    return NextResponse.json({ ok: true, plan })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
