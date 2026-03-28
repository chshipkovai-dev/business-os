import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { defaultTasks, categoryLabel } from '@/lib/tasks'

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
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

function getGroup(dueDate?: string | null): string {
  if (!dueDate) return 'nodate'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff <= 7) return 'week'
  return 'later'
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

  // ── Step 1: detect intent ──────────────────────────────────────────────────
  let intentRaw
  try {
    intentRaw = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      system: 'Ответь одним словом: "question" если пользователь спрашивает о задачах/планах/делах/расписании, "done" если говорит что что-то выполнено/готово/сделано/завершено, "task" если просит добавить/записать/создать задачу.',
      messages: [{ role: 'user', content: text }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await sendTelegramMessage(`❌ Ошибка Claude API: ${msg}`)
    return NextResponse.json({ ok: true })
  }

  const intent = intentRaw.content[0].type === 'text'
    ? intentRaw.content[0].text.trim().toLowerCase()
    : 'task'

  // ── Question flow ──────────────────────────────────────────────────────────
  if (intent.includes('question')) {
    const db = getDB()
    const { data } = await db.from('tasks').select('*').eq('done', false).order('created_at')

    // Merge default + bot tasks
    const botTasks = (data || []).map((r: Record<string, unknown>) => ({
      title: r.title as string,
      category: r.category as string,
      priority: r.priority as string,
      dueDate: r.due_date as string | null,
      group: getGroup(r.due_date as string | null),
    }))

    const allForPrompt = [
      ...defaultTasks.map(t => ({
        title: t.title,
        category: categoryLabel[t.category],
        priority: t.priority,
        dueDate: t.dueDate || null,
        group: getGroup(t.dueDate),
      })),
      ...botTasks.map(t => ({
        title: t.title,
        category: t.category,
        priority: t.priority,
        dueDate: t.dueDate,
        group: t.group,
      })),
    ]

    let answer
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `Ты личный ассистент Denis. Отвечай кратко, по-русски, без лишних слов. Сегодня: ${today}.
Группы задач: overdue=просрочено, today=сегодня, tomorrow=завтра, week=на неделе, later=позже, nodate=без даты.
Форматируй списком с эмодзи категорий: 💰=деньги, 🛠=работа, 📞=звонки, 📌=другое.`,
        messages: [{
          role: 'user',
          content: `Вопрос: "${text}"\n\nЗадачи:\n${JSON.stringify(allForPrompt, null, 2)}`,
        }],
      })
      answer = resp.content[0].type === 'text' ? resp.content[0].text : 'Не смог ответить.'
    } catch {
      answer = 'Не смог получить задачи.'
    }

    await sendTelegramMessage(answer)
    return NextResponse.json({ ok: true })
  }

  // ── Done flow ─────────────────────────────────────────────────────────────
  if (intent.includes('done')) {
    const db = getDB()
    const { data } = await db.from('tasks').select('*').eq('done', false).order('created_at')
    const openTasks = (data || []).map((r: Record<string, unknown>) => ({ id: r.id, title: r.title }))

    if (openTasks.length === 0) {
      await sendTelegramMessage('Нет открытых задач для отметки.')
      return NextResponse.json({ ok: true })
    }

    let matchId: string | null = null
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        system: 'Найди задачу которую пользователь отмечает как выполненную. Верни только id задачи из списка или null если непонятно. Только id, без лишнего текста.',
        messages: [{ role: 'user', content: `Сообщение: "${text}"\n\nЗадачи:\n${JSON.stringify(openTasks)}` }],
      })
      const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
      matchId = raw === 'null' || raw === '' ? null : raw
    } catch { /* ignore */ }

    if (!matchId) {
      // mark the most recent task as done
      matchId = openTasks[0].id as string
    }

    const task = openTasks.find((t: { id: unknown; title: unknown }) => t.id === matchId)
    await db.from('tasks').update({ done: true }).eq('id', matchId)
    await sendTelegramMessage(`✅ Готово! Задача «${task?.title}» отмечена как выполненная.`)
    return NextResponse.json({ ok: true })
  }

  // ── Task flow ──────────────────────────────────────────────────────────────
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await sendTelegramMessage(`❌ Ошибка Claude API: ${msg}`)
    return NextResponse.json({ ok: true })
  }

  let parsed: { title: string; category: string; priority: string; dueDate: string | null }
  try {
    const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    parsed = JSON.parse(cleaned)
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
