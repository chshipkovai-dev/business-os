import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const message = body?.message
  if (!message) return NextResponse.json({ ok: true })

  const chatId = String(message.chat?.id)
  if (chatId !== process.env.TELEGRAM_CHAT_ID) {
    return NextResponse.json({ ok: true })
  }

  const text: string = message.text
  if (!text) return NextResponse.json({ ok: true })

  const today = new Date().toISOString().split('T')[0]

  let response
  try {
    response = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: `Извлеки задачу из сообщения пользователя. Верни только JSON без markdown-блоков:
{"title":"...","category":"money"|"work"|"call"|"other","priority":"high"|"normal"|"low","dueDate":"YYYY-MM-DD"|null}
Сегодня: ${today}.
Правила для дат: "завтра" = следующий день, "послезавтра" = через 2 дня, "пятница"/"пн"/"вт" и т.д. = ближайший такой день недели. Если дата не указана — null.
Категории: money=финансы/оплата/счёт, work=работа/задача/сделать, call=звонок/написать/связаться, other=всё остальное.
Приоритет: high=срочно/важно/асап, low=не срочно, normal=всё остальное.`,
      messages: [{ role: 'user', content: text }],
    })
  } catch {
    await sendTelegramMessage('❌ Ошибка Claude API.')
    return NextResponse.json({ ok: true })
  }

  let parsed: { title: string; category: string; priority: string; dueDate: string | null }
  try {
    const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    parsed = JSON.parse(rawText)
    if (!parsed.title) throw new Error('no title')
  } catch {
    await sendTelegramMessage('❌ Не смог разобрать задачу. Попробуй: "Позвонить клиенту до пятницы" или "Отправить счёт завтра — срочно"')
    return NextResponse.json({ ok: true })
  }

  const db = getDB()
  const { error } = await db.from('tasks').insert({
    title: parsed.title,
    category: parsed.category || 'other',
    priority: parsed.priority || 'normal',
    due_date: parsed.dueDate || null,
    source: 'bot',
  })

  if (error) {
    await sendTelegramMessage('❌ Ошибка сохранения. Попробуй ещё раз.')
    return NextResponse.json({ ok: true })
  }

  const dateStr = parsed.dueDate ? ` · до ${parsed.dueDate}` : ''
  const catEmoji: Record<string, string> = { money: '💰', work: '🛠', call: '📞', other: '📌' }
  const emoji = catEmoji[parsed.category] || '📌'
  await sendTelegramMessage(`✅ Задача добавлена:\n${emoji} «${parsed.title}»${dateStr}`)

  return NextResponse.json({ ok: true })
}
