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

async function transcribeVoice(fileId: string): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN

  // Get file path from Telegram
  const fileInfoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)
  const fileInfo = await fileInfoRes.json() as { result?: { file_path?: string } }
  const filePath = fileInfo.result?.file_path
  if (!filePath) return null

  // Download audio
  const audioRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`)
  const audioBuffer = await audioRes.arrayBuffer()

  // Send to Whisper
  const formData = new FormData()
  formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg')
  formData.append('model', 'whisper-1')
  formData.append('language', 'ru')

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData,
  })

  const data = await whisperRes.json() as { text?: string }
  return data.text || null
}

async function tg(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

function getGroup(dueDate?: string | null): string {
  if (!dueDate) return 'nodate'
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - now.getTime()) / 86400000)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff <= 7) return 'week'
  return 'later'
}

async function getOpenTasks() {
  const db = getDB()
  const { data } = await db.from('tasks').select('*').eq('done', false).order('created_at')
  return data || []
}

function buildTaskList(dbRows: Record<string, unknown>[]) {
  const catEmoji: Record<string, string> = { money: '💰', work: '🛠', call: '📞', other: '📌' }
  return [
    ...defaultTasks.map(t => ({
      id: t.id,
      title: t.title,
      category: categoryLabel[t.category],
      catEmoji: catEmoji[t.category] || '📌',
      priority: t.priority,
      dueDate: t.dueDate || null,
      group: getGroup(t.dueDate),
      source: 'default',
    })),
    ...dbRows.map(r => ({
      id: r.id as string,
      title: r.title as string,
      category: r.category as string,
      catEmoji: catEmoji[r.category as string] || '📌',
      priority: r.priority as string,
      dueDate: r.due_date as string | null,
      group: getGroup(r.due_date as string | null),
      source: 'bot',
    })),
  ]
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const message = body?.message
  if (!message) return NextResponse.json({ ok: true })

  const chatId = String(message.chat?.id)
  if (chatId !== process.env.TELEGRAM_CHAT_ID) return NextResponse.json({ ok: true })

  let text: string
  if (message.text) {
    text = message.text
  } else if (message.voice) {
    const transcribed = await transcribeVoice(message.voice.file_id)
    if (!transcribed) {
      await tg('Не смог распознать голосовое. Попробуй ещё раз.')
      return NextResponse.json({ ok: true })
    }
    await tg(`🎤 Распознал: «${transcribed}»`)
    text = transcribed
  } else {
    return NextResponse.json({ ok: true })
  }

  const today = new Date().toISOString().split('T')[0]

  // ── Detect intent ──────────────────────────────────────────────────────────
  let intentRaw
  try {
    intentRaw = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 15,
      system: `Определи намерение. Ответь одним словом:
"morning" — утреннее приветствие или просьба показать план на день (доброе утро, что сегодня, планы на день)
"question" — вопрос о конкретных задачах или списке
"prioritize" — просьба расставить приоритеты или с чего начать
"done" — говорит что что-то выполнено/готово/сделано
"delete" — просит удалить/убрать/стереть задачу
"reschedule" — просит перенести/отложить/сдвинуть дату задачи
"task" — просит добавить/записать/создать новую задачу`,
      messages: [{ role: 'user', content: text }],
    })
  } catch (err) {
    await tg(`❌ Ошибка: ${err instanceof Error ? err.message : String(err)}`)
    return NextResponse.json({ ok: true })
  }

  const intent = intentRaw.content[0].type === 'text'
    ? intentRaw.content[0].text.trim().toLowerCase()
    : 'task'

  // ── Morning briefing ───────────────────────────────────────────────────────
  if (intent.includes('morning')) {
    const rows = await getOpenTasks()
    const tasks = buildTaskList(rows)

    const overdue = tasks.filter(t => t.group === 'overdue')
    const todayTasks = tasks.filter(t => t.group === 'today')
    const highPriority = tasks.filter(t => t.priority === 'high' && t.group !== 'today' && t.group !== 'overdue')

    let msg = `☀️ Доброе утро!\n\n`

    if (overdue.length > 0) {
      msg += `🔴 Просрочено (${overdue.length}):\n`
      overdue.forEach(t => { msg += `  ${t.catEmoji} ${t.title}\n` })
      msg += '\n'
    }

    if (todayTasks.length > 0) {
      msg += `📅 Сегодня (${todayTasks.length}):\n`
      todayTasks.forEach(t => {
        const flag = t.priority === 'high' ? ' ⚠️' : ''
        msg += `  ${t.catEmoji}${flag} ${t.title}\n`
      })
      msg += '\n'
    } else {
      msg += `📅 На сегодня задач нет.\n\n`
    }

    if (highPriority.length > 0) {
      msg += `⚠️ Высокий приоритет (другие дни):\n`
      highPriority.forEach(t => { msg += `  ${t.catEmoji} ${t.title}\n` })
      msg += '\n'
    }

    const first = [...overdue, ...todayTasks.filter(t => t.priority === 'high'), ...todayTasks][0]
    if (first) msg += `🎯 Начни с: «${first.title}»`

    await tg(msg.trim())
    return NextResponse.json({ ok: true })
  }

  // ── Question flow ──────────────────────────────────────────────────────────
  if (intent.includes('question')) {
    const rows = await getOpenTasks()
    const tasks = buildTaskList(rows)

    let answer
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: `Ты личный ассистент Denis. Отвечай кратко по-русски. Сегодня: ${today}.
Группы: overdue=просрочено, today=сегодня, tomorrow=завтра, week=на неделе, later=позже, nodate=без даты.
Эмодзи: 💰=деньги, 🛠=работа, 📞=звонки, 📌=другое.`,
        messages: [{ role: 'user', content: `Вопрос: "${text}"\n\nЗадачи:\n${JSON.stringify(tasks, null, 2)}` }],
      })
      answer = resp.content[0].type === 'text' ? resp.content[0].text : 'Не смог ответить.'
    } catch { answer = 'Не смог получить задачи.' }

    await tg(answer)
    return NextResponse.json({ ok: true })
  }

  // ── Prioritize flow ────────────────────────────────────────────────────────
  if (intent.includes('prioritize')) {
    const rows = await getOpenTasks()
    const tasks = buildTaskList(rows)

    let answer
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: `Ты личный бизнес-ассистент Denis. Сегодня: ${today}. Посмотри на задачи и дай короткий чёткий совет: что делать прямо сейчас и почему. Учитывай просроченные, дедлайны, приоритет. Максимум 5 строк. Без воды.`,
        messages: [{ role: 'user', content: `Задачи:\n${JSON.stringify(tasks, null, 2)}` }],
      })
      answer = resp.content[0].type === 'text' ? `🎯 ${resp.content[0].text}` : 'Не смог ответить.'
    } catch { answer = 'Не смог проанализировать задачи.' }

    await tg(answer)
    return NextResponse.json({ ok: true })
  }

  // ── Done flow ──────────────────────────────────────────────────────────────
  if (intent.includes('done')) {
    const rows = await getOpenTasks()
    const openTasks = rows.map(r => ({ id: r.id, title: r.title }))

    if (openTasks.length === 0) {
      await tg('Нет открытых задач для отметки.')
      return NextResponse.json({ ok: true })
    }

    let matchId: string | null = null
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        system: 'Найди задачу которую пользователь отмечает как выполненную. Верни только id из списка или null. Только id, без лишнего.',
        messages: [{ role: 'user', content: `Сообщение: "${text}"\n\nЗадачи:\n${JSON.stringify(openTasks)}` }],
      })
      const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
      matchId = (raw === 'null' || raw === '') ? null : raw
    } catch { /* ignore */ }

    if (!matchId) matchId = openTasks[0].id as string

    const task = openTasks.find(t => t.id === matchId)
    await getDB().from('tasks').update({ done: true }).eq('id', matchId)
    await tg(`✅ Готово! «${task?.title}» отмечена как выполненная.`)
    return NextResponse.json({ ok: true })
  }

  // ── Delete flow ────────────────────────────────────────────────────────────
  if (intent.includes('delete')) {
    const rows = await getOpenTasks()
    const openTasks = rows.map(r => ({ id: r.id, title: r.title }))

    if (openTasks.length === 0) {
      await tg('Нет задач для удаления.')
      return NextResponse.json({ ok: true })
    }

    let matchId: string | null = null
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        system: 'Найди задачу которую пользователь хочет удалить. Верни только id из списка или null. Только id.',
        messages: [{ role: 'user', content: `Сообщение: "${text}"\n\nЗадачи:\n${JSON.stringify(openTasks)}` }],
      })
      const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
      matchId = (raw === 'null' || raw === '') ? null : raw
    } catch { /* ignore */ }

    if (!matchId) {
      await tg('Не понял какую задачу удалить. Уточни название.')
      return NextResponse.json({ ok: true })
    }

    const task = openTasks.find(t => t.id === matchId)
    await getDB().from('tasks').delete().eq('id', matchId)
    await tg(`🗑 Задача «${task?.title}» удалена.`)
    return NextResponse.json({ ok: true })
  }

  // ── Reschedule flow ────────────────────────────────────────────────────────
  if (intent.includes('reschedule')) {
    const rows = await getOpenTasks()
    const openTasks = rows.map(r => ({ id: r.id, title: r.title, due_date: r.due_date }))

    if (openTasks.length === 0) {
      await tg('Нет задач для переноса.')
      return NextResponse.json({ ok: true })
    }

    let match: { id: string; newDate: string } | null = null
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: `Найди задачу и новую дату. Верни JSON без markdown: {"id":"...","newDate":"YYYY-MM-DD"}. Сегодня: ${today}. "следующая неделя"=+7 дней, "пятница"=ближайшая пятница. Только JSON.`,
        messages: [{ role: 'user', content: `Сообщение: "${text}"\n\nЗадачи:\n${JSON.stringify(openTasks)}` }],
      })
      const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      match = JSON.parse(cleaned)
    } catch { /* ignore */ }

    if (!match?.id || !match?.newDate) {
      await tg('Не понял какую задачу и на когда перенести. Попробуй: "Перенеси Ailnex на пятницу"')
      return NextResponse.json({ ok: true })
    }

    const task = openTasks.find(t => t.id === match!.id)
    await getDB().from('tasks').update({ due_date: match.newDate }).eq('id', match.id)
    await tg(`📅 «${task?.title}» перенесена на ${match.newDate}`)
    return NextResponse.json({ ok: true })
  }

  // ── Task flow (default) ────────────────────────────────────────────────────
  let response
  try {
    response = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: `Извлеки задачу. Верни только JSON без markdown:
{"title":"...","category":"money"|"work"|"call"|"other","priority":"high"|"normal"|"low","dueDate":"YYYY-MM-DD"|null}
Сегодня: ${today}. "завтра"=+1 день, "послезавтра"=+2 дня, день недели=ближайший. Если дата не указана — null.
money=финансы/счёт, work=работа/задача, call=звонок/написать, other=остальное.
high=срочно/важно, low=не срочно, normal=всё остальное.`,
      messages: [{ role: 'user', content: text }],
    })
  } catch (err) {
    await tg(`❌ Ошибка Claude API: ${err instanceof Error ? err.message : String(err)}`)
    return NextResponse.json({ ok: true })
  }

  let parsed: { title: string; category: string; priority: string; dueDate: string | null }
  try {
    const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    parsed = JSON.parse(cleaned)
    if (!parsed.title) throw new Error('no title')
  } catch {
    await tg('Не понял. Попробуй: "Позвонить клиенту в пятницу" или "Отправить счёт завтра — срочно"')
    return NextResponse.json({ ok: true })
  }

  const { error } = await getDB().from('tasks').insert({
    title: parsed.title,
    category: parsed.category || 'other',
    priority: parsed.priority || 'normal',
    due_date: parsed.dueDate || null,
    source: 'bot',
  })

  if (error) {
    await tg('❌ Ошибка сохранения. Попробуй ещё раз.')
    return NextResponse.json({ ok: true })
  }

  const catEmoji: Record<string, string> = { money: '💰', work: '🛠', call: '📞', other: '📌' }
  const dateStr = parsed.dueDate ? ` · до ${parsed.dueDate}` : ''
  await tg(`✅ Задача добавлена:\n${catEmoji[parsed.category] || '📌'} «${parsed.title}»${dateStr}`)

  return NextResponse.json({ ok: true })
}
