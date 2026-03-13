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

const RESEARCH_PROMPT = `Ты эксперт-аналитик стартапов, специализирующийся на micro-SaaS и AI агентах.
Сделай ГЛУБОКОЕ исследование этой бизнес-идеи. Будь конкретен с цифрами.
ВАЖНО: весь текст в JSON должен быть на РУССКОМ языке.

Идея: {TITLE}
Описание: {DESCRIPTION}
Проблема: {PROBLEM}
Целевая аудитория: {AUDIENCE}

Ответь ТОЛЬКО валидным JSON (без markdown, только JSON):
{
  "summary": "3-4 предложения — резюме возможности на русском",
  "market_size": "Конкретный размер рынка с цифрами. Пример: '4.5М фрилансеров в США, рынок $2.1B'",
  "competitors": [
    {"name": "НазваниеКонкурента", "price": "$X/мес", "weakness": "Чего им не хватает — на русском"},
    {"name": "НазваниеКонкурента2", "price": "$X/мес", "weakness": "Чего им не хватает — на русском"},
    {"name": "НазваниеКонкурента3", "price": "$X/мес", "weakness": "Чего им не хватает — на русском"}
  ],
  "icp": "Точный портрет кто платит. Пример: 'Фриланс-дизайнер, 3-10 клиентов, зарабатывает $5-15k/мес, использует Gmail, злится на просроченные оплаты'",
  "build_time_days": 14,
  "weeks_to_first_revenue": 3,
  "mrr_month1": 195,
  "mrr_month3": 1014,
  "revenue_potential": "Конкретный путь: Неделя 3 = первые $39, Месяц 1 = 5 клиентов = $195, Месяц 3 = 26 клиентов = $1014",
  "speed_score": 8,
  "build_plan": "Шаг 1: [конкретная задача] (Дни 1-3). Шаг 2: [конкретная задача] (Дни 4-7). Шаг 3: [конкретная задача] (Дни 8-14). Шаг 4: Запуск на Reddit + ProductHunt (Неделя 3).",
  "first_action": "Самое важное что нужно сделать СЕГОДНЯ чтобы проверить эту идею"
}

speed_score: 10 = первые деньги через 1-2 недели, 1 = нужно 6+ месяцев.
Будь реалистичен но оптимистичен для человека который строит с AI (Claude Code, Cursor).
Предполагай базовые навыки разработки + AI инструменты.`

export async function POST(req: NextRequest) {
  const { idea } = await req.json()

  if (!idea?.title) {
    return NextResponse.json({ error: 'No idea provided' }, { status: 400 })
  }

  const prompt = RESEARCH_PROMPT
    .replace('{TITLE}', idea.title)
    .replace('{DESCRIPTION}', idea.description || '')
    .replace('{PROBLEM}', idea.problem || idea.description || '')
    .replace('{AUDIENCE}', idea.target_audience || idea.audience || '')

  try {
    const response = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    // Убираем markdown блоки если Claude их добавил
    const text = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const data = JSON.parse(text)

    // Сохраняем в Supabase
    const db = getDB()
    await db.from('research').upsert({
      idea_title: idea.title,
      summary: data.summary,
      market_size: data.market_size,
      competitors: data.competitors,
      icp: data.icp,
      build_time_days: data.build_time_days,
      weeks_to_first_revenue: data.weeks_to_first_revenue,
      mrr_month1: data.mrr_month1,
      mrr_month3: data.mrr_month3,
      revenue_potential: data.revenue_potential,
      build_plan: data.build_plan,
      speed_score: data.speed_score,
    }, { onConflict: 'idea_title' })

    // Telegram уведомление
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (token && chatId) {
      const msg = [
        `🔬 <b>Исследование завершено</b>`,
        ``,
        `<b>${idea.title}</b>`,
        ``,
        `⚡ Первые деньги: через <b>${data.weeks_to_first_revenue} нед.</b>`,
        `🔨 Сборка MVP: <b>${data.build_time_days} дней</b>`,
        `💰 MRR месяц 1: <b>$${data.mrr_month1}</b>`,
        `💰 MRR месяц 3: <b>$${data.mrr_month3}</b>`,
        ``,
        `📊 ${data.summary}`,
        ``,
        `🎯 Первый шаг: ${data.first_action}`,
      ].join('\n')

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
      }).catch(() => {})
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
