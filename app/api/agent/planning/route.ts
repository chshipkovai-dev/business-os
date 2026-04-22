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

async function sendTelegram(msg: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
  }).catch(() => {})
}

const PLANNING_PROMPT = `Ты — Senior Planning Agent компании ailnex. Получаешь задачу на разработку и делаешь ГЛУБОКИЙ анализ перед тем как передать разработчику.

Задача: {TITLE}
Детали: {NOTES}
Тип: {CATEGORY}

Сделай профессиональный технический анализ. Ответь ТОЛЬКО валидным JSON без markdown:
{
  "project_name": "короткое название проекта",
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
    "pages": ["список страниц или экранов"],
    "components": ["список компонентов"],
    "api_routes": ["список API роутов если нужны"],
    "db_tables": ["список таблиц Supabase если нужны"]
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
  "first_file": "первый файл который нужно создать — например app/page.tsx"
}`

export async function POST(req: NextRequest) {
  const { task_id, title, notes, category } = await req.json()

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const prompt = PLANNING_PROMPT
    .replace('{TITLE}', title)
    .replace('{NOTES}', notes || 'нет')
    .replace('{CATEGORY}', category || 'work')

  try {
    const response = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const text = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const plan = JSON.parse(text)

    const db = getDB()
    if (task_id) {
      await db.from('tasks').update({
        agent_status: 'planned',
        notes: `[PLANNING AGENT]\n${JSON.stringify(plan, null, 2)}`,
      }).eq('id', task_id)
    }

    const complexityEmoji: Record<string, string> = { low: '🟢', medium: '🟡', high: '🔴' }
    const complexityLabel: Record<string, string> = { low: 'Низкая', medium: 'Средняя', high: 'Высокая' }

    const msg = [
      `📋 <b>Planning Agent — план готов</b>`,
      ``,
      `<b>${plan.project_name}</b>`,
      `🎯 ${plan.goal}`,
      ``,
      `${complexityEmoji[plan.complexity] ?? '🟡'} Сложность: <b>${complexityLabel[plan.complexity] ?? plan.complexity}</b>`,
      `⏱ Оценка: <b>${plan.estimate_days} дней</b>`,
      ``,
      `<b>Use Cases:</b>`,
      ...plan.use_cases.map((uc: string) => `• ${uc}`),
      ``,
      `<b>Структура:</b>`,
      `📄 Страниц: ${plan.structure.pages.length}`,
      `🧩 Компонентов: ${plan.structure.components.length}`,
      `🔌 API роутов: ${plan.structure.api_routes.length}`,
      ``,
      `<b>План разработки:</b>`,
      ...plan.build_plan.map((day: string) => `• ${day}`),
      ``,
      `🚀 Первый файл: <code>${plan.first_file}</code>`,
      ``,
      `✅ Апрув? Ответь <b>да</b> чтобы передать Builder Agent`,
    ].join('\n')

    await sendTelegram(msg)

    return NextResponse.json({ ok: true, plan })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
