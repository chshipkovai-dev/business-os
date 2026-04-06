import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { defaultTasks, categoryLabel } from '@/lib/tasks'

export const maxDuration = 60

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Voice transcription ───────────────────────────────────────────────────────

async function transcribeVoice(fileId: string): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN

  const fileInfoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)
  const fileInfo = await fileInfoRes.json() as { result?: { file_path?: string } }
  const filePath = fileInfo.result?.file_path
  if (!filePath) throw new Error(`no file_path, response: ${JSON.stringify(fileInfo)}`)

  const audioRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`)
  if (!audioRes.ok) throw new Error(`audio download failed: ${audioRes.status}`)
  const audioBuffer = await audioRes.arrayBuffer()

  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY не задан в env')

  const formData = new FormData()
  formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg; codecs=opus' }), 'voice.ogg')
  formData.append('model', 'whisper-1')
  formData.append('language', 'ru')
  formData.append('response_format', 'json')

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData,
  })

  const data = await whisperRes.json() as { text?: string; error?: { message?: string } }
  if (!whisperRes.ok) throw new Error(`Whisper error ${whisperRes.status}: ${data.error?.message || JSON.stringify(data)}`)
  if (!data.text) throw new Error(`Whisper вернул пустой текст: ${JSON.stringify(data)}`)
  return data.text
}

// ─── Telegram send ─────────────────────────────────────────────────────────────

async function tg(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

// ─── Data helpers ──────────────────────────────────────────────────────────────

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

async function getProjects() {
  const db = getDB()
  const { data } = await db.from('projects').select('*').eq('archived', false).order('created_at')
  return data || []
}

async function getOrders() {
  const db = getDB()
  const { data } = await db.from('orders').select('*').order('created_at', { ascending: false })
  return data || []
}

const catEmoji: Record<string, string> = { money: '💰', work: '🛠', call: '📞', other: '📌' }
const stageEmoji: Record<string, string> = { idea: '💡', building: '🛠', launched: '🚀' }
const stageLabel: Record<string, string> = { idea: 'Идея', building: 'Разработка', launched: 'Запущен' }
const statusEmoji: Record<string, string> = { new: '🆕', discussion: '💬', in_progress: '🔨', done: '✅', invoiced: '🧾' }
const statusLabel: Record<string, string> = { new: 'Новый', discussion: 'Переговоры', in_progress: 'В работе', done: 'Готово', invoiced: 'Счёт выставлен' }

function buildTaskList(dbRows: Record<string, unknown>[]) {
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

// ─── Main webhook ──────────────────────────────────────────────────────────────

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
    try {
      const transcribed = await transcribeVoice(message.voice.file_id)
      await tg(`🎤 Распознал: «${transcribed}»`)
      text = transcribed
    } catch (err) {
      await tg(`❌ Голосовое: ${err instanceof Error ? err.message : String(err)}`)
      return NextResponse.json({ ok: true })
    }
  } else {
    return NextResponse.json({ ok: true })
  }

  const today = new Date().toISOString().split('T')[0]

  // ── Intent detection ───────────────────────────────────────────────────────
  let intentRaw
  try {
    intentRaw = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      system: `Определи намерение пользователя. Ответь ТОЛЬКО одним словом из списка:

"morning" — утро, план на день, что сегодня делать, доброе утро
"summary" — полный обзор всего (задачи+проекты+заказы), дайджест, что происходит
"list" — показать список задач
"question" — любой вопрос о конкретных задачах или их статусе
"prioritize" — с чего начать, что важнее, расставь приоритеты
"done" — выполнил/сделал/готово/закончил конкретную задачу
"edit_task" — изменить задачу: приоритет, категорию, заметки, название
"delete_all" — удалить ВСЕ задачи сразу (все, очисти, стереть всё)
"delete" — удалить одну конкретную задачу
"reschedule" — перенести/отложить задачу на другую дату
"project_list" — показать все проекты с их статусами/этапами
"project_update" — изменить этап проекта (идея/разработка/запущен)
"project_add" — добавить новый проект
"order_list" — показать заказы/клиентов
"order_update" — изменить статус заказа
"order_add" — добавить новый заказ или клиента
"ideas_top" — топ идеи из базы скаута
"task" — добавить новую задачу или записать что-то
"chat" — всё остальное: советы, вопросы не про задачи, разговор`,
      messages: [{ role: 'user', content: text }],
    })
  } catch (err) {
    await tg(`❌ Ошибка: ${err instanceof Error ? err.message : String(err)}`)
    return NextResponse.json({ ok: true })
  }

  const intent = intentRaw.content[0].type === 'text'
    ? intentRaw.content[0].text.trim().toLowerCase().split(/\s/)[0]
    : 'task'

  // ── Morning briefing ───────────────────────────────────────────────────────
  if (intent === 'morning') {
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
      msg += `⚠️ Высокий приоритет:\n`
      highPriority.forEach(t => { msg += `  ${t.catEmoji} ${t.title}\n` })
      msg += '\n'
    }

    const first = [...overdue, ...todayTasks.filter(t => t.priority === 'high'), ...todayTasks][0]
    if (first) msg += `🎯 Начни с: «${first.title}»`

    await tg(msg.trim())
    return NextResponse.json({ ok: true })
  }

  // ── Full summary ───────────────────────────────────────────────────────────
  if (intent === 'summary') {
    const [rows, projects, orders] = await Promise.all([getOpenTasks(), getProjects(), getOrders()])
    const tasks = buildTaskList(rows)

    const overdue = tasks.filter(t => t.group === 'overdue')
    const todayTasks = tasks.filter(t => t.group === 'today')
    const highPriority = tasks.filter(t => t.priority === 'high' && !['today', 'overdue'].includes(t.group))

    let msg = `📊 <b>Дайджест Ailnex — ${new Date().toLocaleDateString('ru-RU')}</b>\n\n`

    // Tasks
    msg += `📋 <b>Задачи</b>\n`
    if (overdue.length > 0) {
      msg += `  🔴 Просрочено (${overdue.length}): ${overdue.map(t => t.title).join(', ')}\n`
    }
    if (todayTasks.length > 0) {
      msg += `  📅 Сегодня (${todayTasks.length}): ${todayTasks.map(t => t.title).join(', ')}\n`
    }
    if (highPriority.length > 0) {
      msg += `  ⚠️ Высокий приоритет: ${highPriority.map(t => t.title).join(', ')}\n`
    }
    if (overdue.length === 0 && todayTasks.length === 0 && highPriority.length === 0) {
      msg += `  ✅ Всё в порядке\n`
    }
    msg += '\n'

    // Projects
    if (projects.length > 0) {
      msg += `🏗 <b>Проекты</b>\n`
      projects.forEach((p: Record<string, unknown>) => {
        msg += `  ${stageEmoji[p.stage as string] || '📁'} ${p.title} — ${stageLabel[p.stage as string] || p.stage}\n`
      })
      msg += '\n'
    }

    // Orders
    if (orders.length > 0) {
      msg += `💼 <b>Заказы</b>\n`
      orders.forEach((o: Record<string, unknown>) => {
        const budget = o.budget ? ` · ${o.budget}` : ''
        msg += `  ${statusEmoji[o.status as string] || '📋'} ${o.client} — ${o.title}${budget}\n`
      })
    }

    await tg(msg.trim())
    return NextResponse.json({ ok: true })
  }

  // ── List tasks ─────────────────────────────────────────────────────────────
  if (intent === 'list') {
    const rows = await getOpenTasks()
    const tasks = buildTaskList(rows)

    if (tasks.length === 0) {
      await tg('📋 Задач нет. Отлично!')
      return NextResponse.json({ ok: true })
    }

    const groups: Record<string, typeof tasks> = { overdue: [], today: [], tomorrow: [], week: [], later: [], nodate: [] }
    tasks.forEach(t => groups[t.group]?.push(t))

    const groupLabel: Record<string, string> = {
      overdue: '🔴 Просрочено',
      today: '📅 Сегодня',
      tomorrow: '⏰ Завтра',
      week: '📆 На неделе',
      later: '🗓 Позже',
      nodate: '📌 Без даты',
    }

    let msg = `📋 Все задачи (${tasks.length}):\n`
    for (const [key, label] of Object.entries(groupLabel)) {
      if (groups[key].length === 0) continue
      msg += `\n${label}:\n`
      groups[key].forEach(t => {
        const flag = t.priority === 'high' ? ' ⚠️' : ''
        msg += `  ${t.catEmoji}${flag} ${t.title}\n`
      })
    }

    await tg(msg.trim())
    return NextResponse.json({ ok: true })
  }

  // ── Question ───────────────────────────────────────────────────────────────
  if (intent === 'question') {
    const rows = await getOpenTasks()
    const tasks = buildTaskList(rows)

    let answer
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: `Ты личный ассистент Denis. Отвечай кратко по-русски. Сегодня: ${today}.
Группы: overdue=просрочено, today=сегодня, tomorrow=завтра, week=на неделе, later=позже, nodate=без даты.`,
        messages: [{ role: 'user', content: `Вопрос: "${text}"\n\nЗадачи:\n${JSON.stringify(tasks, null, 2)}` }],
      })
      answer = resp.content[0].type === 'text' ? resp.content[0].text : 'Не смог ответить.'
    } catch { answer = 'Не смог получить задачи.' }

    await tg(answer)
    return NextResponse.json({ ok: true })
  }

  // ── Prioritize ─────────────────────────────────────────────────────────────
  if (intent === 'prioritize') {
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

  // ── Done ───────────────────────────────────────────────────────────────────
  if (intent === 'done') {
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
        system: 'Найди задачу которую пользователь отмечает как выполненную. Верни только id из списка или null.',
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

  // ── Edit task ──────────────────────────────────────────────────────────────
  if (intent === 'edit_task') {
    const rows = await getOpenTasks()
    const openTasks = rows.map(r => ({ id: r.id, title: r.title, priority: r.priority, category: r.category, notes: r.notes }))

    if (openTasks.length === 0) {
      await tg('Нет задач для редактирования.')
      return NextResponse.json({ ok: true })
    }

    let match: { id: string; field: string; value: string } | null = null
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: `Найди задачу и что нужно изменить. Верни JSON: {"id":"...","field":"priority"|"category"|"notes"|"title","value":"..."}.
priority: high/normal/low. category: money/work/call/other. Только JSON без markdown.`,
        messages: [{ role: 'user', content: `Сообщение: "${text}"\n\nЗадачи:\n${JSON.stringify(openTasks)}` }],
      })
      const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      match = JSON.parse(cleaned)
    } catch { /* ignore */ }

    if (!match?.id || !match?.field) {
      await tg('Не понял что изменить. Попробуй: "Поставь задаче Ailnex высокий приоритет"')
      return NextResponse.json({ ok: true })
    }

    const task = openTasks.find(t => t.id === match!.id)
    await getDB().from('tasks').update({ [match.field]: match.value }).eq('id', match.id)
    await tg(`✏️ «${task?.title}»: ${match.field} → ${match.value}`)
    return NextResponse.json({ ok: true })
  }

  // ── Delete all ─────────────────────────────────────────────────────────────
  if (intent === 'delete_all') {
    const rows = await getOpenTasks()
    if (rows.length === 0) {
      await tg('Задач нет — удалять нечего.')
      return NextResponse.json({ ok: true })
    }
    const ids = rows.map(r => r.id as string)
    await getDB().from('tasks').delete().in('id', ids)
    await tg(`🗑 Удалено ${ids.length} задач из базы.`)
    return NextResponse.json({ ok: true })
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  if (intent === 'delete') {
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
        system: 'Найди задачу которую пользователь хочет удалить. Верни только id из списка или null.',
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

  // ── Reschedule ─────────────────────────────────────────────────────────────
  if (intent === 'reschedule') {
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
        system: `Найди задачу и новую дату. Верни JSON: {"id":"...","newDate":"YYYY-MM-DD"}. Сегодня: ${today}. Только JSON.`,
        messages: [{ role: 'user', content: `Сообщение: "${text}"\n\nЗадачи:\n${JSON.stringify(openTasks)}` }],
      })
      const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      match = JSON.parse(cleaned)
    } catch { /* ignore */ }

    if (!match?.id || !match?.newDate) {
      await tg('Не понял. Попробуй: "Перенеси Ailnex на пятницу"')
      return NextResponse.json({ ok: true })
    }

    const task = openTasks.find(t => t.id === match!.id)
    await getDB().from('tasks').update({ due_date: match.newDate }).eq('id', match.id)
    await tg(`📅 «${task?.title}» перенесена на ${match.newDate}`)
    return NextResponse.json({ ok: true })
  }

  // ── Project list ───────────────────────────────────────────────────────────
  if (intent === 'project_list') {
    const projects = await getProjects()

    if (projects.length === 0) {
      await tg('Проектов нет.')
      return NextResponse.json({ ok: true })
    }

    let msg = `🏗 <b>Проекты Ailnex</b>\n\n`
    const byStage: Record<string, typeof projects> = { idea: [], building: [], launched: [] }
    projects.forEach((p: Record<string, unknown>) => {
      const stage = p.stage as string
      if (!byStage[stage]) byStage[stage] = []
      byStage[stage].push(p)
    })

    for (const [stage, list] of Object.entries(byStage)) {
      if (list.length === 0) continue
      msg += `${stageEmoji[stage]} <b>${stageLabel[stage]}</b>\n`
      list.forEach((p: Record<string, unknown>) => {
        const nextStep = p.next_step ? `\n    → ${p.next_step}` : ''
        msg += `  • ${p.title}${nextStep}\n`
      })
      msg += '\n'
    }

    await tg(msg.trim())
    return NextResponse.json({ ok: true })
  }

  // ── Project update ─────────────────────────────────────────────────────────
  if (intent === 'project_update') {
    const projects = await getProjects()
    const projectList = projects.map((p: Record<string, unknown>) => ({ id: p.id, title: p.title, stage: p.stage }))

    let match: { id: string; newStage: string } | null = null
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: `Найди проект и новый этап. Верни JSON: {"id":"...","newStage":"idea"|"building"|"launched"}.
idea=идея/замысел, building=разработка/строю/работаю, launched=запущен/живой/готов. Только JSON.`,
        messages: [{ role: 'user', content: `Сообщение: "${text}"\n\nПроекты:\n${JSON.stringify(projectList)}` }],
      })
      const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      match = JSON.parse(cleaned)
    } catch { /* ignore */ }

    if (!match?.id || !match?.newStage) {
      await tg('Не понял. Попробуй: "Переведи ReviewAgent в launched"')
      return NextResponse.json({ ok: true })
    }

    const proj = projectList.find((p: Record<string, unknown>) => p.id === match!.id)
    await getDB().from('projects').update({ stage: match.newStage }).eq('id', match.id)
    await tg(`${stageEmoji[match.newStage]} «${proj?.title}» теперь в статусе: ${stageLabel[match.newStage]}`)
    return NextResponse.json({ ok: true })
  }

  // ── Project add ────────────────────────────────────────────────────────────
  if (intent === 'project_add') {
    let parsed: { title: string; description?: string; stage?: string; url?: string } | null = null
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: `Извлеки данные нового проекта. Верни JSON: {"title":"...","description":"...","stage":"idea"|"building"|"launched","url":"..."|null}.
Если этап не указан — "idea". Только JSON без markdown.`,
        messages: [{ role: 'user', content: text }],
      })
      const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      parsed = JSON.parse(cleaned)
    } catch { /* ignore */ }

    if (!parsed?.title) {
      await tg('Не понял название проекта. Попробуй: "Добавь проект EmailAgent — AI рассылки, статус идея"')
      return NextResponse.json({ ok: true })
    }

    const { data } = await getDB().from('projects').insert({
      title: parsed.title,
      description: parsed.description || null,
      stage: parsed.stage || 'idea',
      url: parsed.url || null,
    }).select().single()

    await tg(`${stageEmoji[parsed.stage || 'idea']} Проект добавлен: «${data?.title}»\nСтатус: ${stageLabel[parsed.stage || 'idea']}`)
    return NextResponse.json({ ok: true })
  }

  // ── Order list ─────────────────────────────────────────────────────────────
  if (intent === 'order_list') {
    const orders = await getOrders()

    if (orders.length === 0) {
      await tg('Заказов нет.')
      return NextResponse.json({ ok: true })
    }

    let msg = `💼 <b>Заказы</b>\n\n`
    orders.forEach((o: Record<string, unknown>) => {
      const budget = o.budget ? ` · ${o.budget}` : ''
      const deadline = o.deadline ? ` · до ${o.deadline}` : ''
      msg += `${statusEmoji[o.status as string] || '📋'} <b>${o.title}</b>\n`
      msg += `   👤 ${o.client}${budget}${deadline}\n`
      if (o.notes) msg += `   💬 ${o.notes}\n`
      msg += '\n'
    })

    await tg(msg.trim())
    return NextResponse.json({ ok: true })
  }

  // ── Order update ───────────────────────────────────────────────────────────
  if (intent === 'order_update') {
    const orders = await getOrders()
    const orderList = orders.map((o: Record<string, unknown>) => ({ id: o.id, title: o.title, client: o.client, status: o.status }))

    let match: { id: string; newStatus: string } | null = null
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: `Найди заказ и новый статус. Верни JSON: {"id":"...","newStatus":"new"|"discussion"|"in_progress"|"done"|"invoiced"}.
new=новый, discussion=переговоры/обсуждение, in_progress=в работе/делаю, done=готово/выполнено, invoiced=счёт/выставил. Только JSON.`,
        messages: [{ role: 'user', content: `Сообщение: "${text}"\n\nЗаказы:\n${JSON.stringify(orderList)}` }],
      })
      const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      match = JSON.parse(cleaned)
    } catch { /* ignore */ }

    if (!match?.id || !match?.newStatus) {
      await tg('Не понял. Попробуй: "Переведи заказ Access в работу"')
      return NextResponse.json({ ok: true })
    }

    const order = orderList.find((o: Record<string, unknown>) => o.id === match!.id)
    await getDB().from('orders').update({ status: match.newStatus }).eq('id', match.id)
    await tg(`${statusEmoji[match.newStatus]} «${order?.title}» → ${statusLabel[match.newStatus]}`)
    return NextResponse.json({ ok: true })
  }

  // ── Order add ──────────────────────────────────────────────────────────────
  if (intent === 'order_add') {
    let parsed: { client: string; title: string; budget?: string; description?: string; status?: string } | null = null
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: `Извлеки данные нового заказа. Верни JSON: {"client":"...","title":"...","description":"..."|null,"budget":"..."|null,"status":"new"|"discussion"|"in_progress"}.
Если статус не ясен — "new". Только JSON без markdown.`,
        messages: [{ role: 'user', content: text }],
      })
      const raw = resp.content[0].type === 'text' ? resp.content[0].text.trim() : ''
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      parsed = JSON.parse(cleaned)
    } catch { /* ignore */ }

    if (!parsed?.client || !parsed?.title) {
      await tg('Не понял. Попробуй: "Новый заказ: клиент Petr, лендинг для стоматологии, бюджет 20k CZK"')
      return NextResponse.json({ ok: true })
    }

    const { data } = await getDB().from('orders').insert({
      client: parsed.client,
      title: parsed.title,
      description: parsed.description || null,
      budget: parsed.budget || null,
      status: parsed.status || 'new',
    }).select().single()

    await tg(`${statusEmoji[parsed.status || 'new']} Заказ добавлен:\n👤 ${data?.client} — «${data?.title}»${parsed.budget ? `\n💰 ${parsed.budget}` : ''}`)
    return NextResponse.json({ ok: true })
  }

  // ── Top ideas ──────────────────────────────────────────────────────────────
  if (intent === 'ideas_top') {
    const { data: ideas } = await getDB()
      .from('ideas')
      .select('title, total_score, target_audience, tags')
      .neq('status', 'archived')
      .gte('total_score', 7.0)
      .order('total_score', { ascending: false })
      .limit(5)

    if (!ideas || ideas.length === 0) {
      await tg('Идей с оценкой ≥7 пока нет.')
      return NextResponse.json({ ok: true })
    }

    let msg = `🔥 <b>Топ идеи из скаута</b>\n\n`
    ideas.forEach((idea: Record<string, unknown>, i: number) => {
      const tier = (idea.total_score as number) >= 8 ? 'S' : 'A'
      msg += `${i + 1}. <b>${idea.title}</b> [${tier}] ${idea.total_score}/10\n`
      if (idea.target_audience) msg += `   👥 ${idea.target_audience}\n`
      msg += '\n'
    })

    await tg(msg.trim())
    return NextResponse.json({ ok: true })
  }

  // ── Chat (free-form) ───────────────────────────────────────────────────────
  if (intent === 'chat') {
    const rows = await getOpenTasks()
    const tasks = buildTaskList(rows)

    let answer
    try {
      const resp = await ai.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `Ты личный ассистент Denis (основатель Ailnex — автоматизация для бизнеса, живёт в Праге).
Отвечай кратко и по делу на русском языке. Сегодня: ${today}.
Текущие задачи Denis: ${JSON.stringify(tasks.map(t => t.title))}
Помогай с советами по бизнесу, продуктам, стратегии — всем что Denis спрашивает.`,
        messages: [{ role: 'user', content: text }],
      })
      answer = resp.content[0].type === 'text' ? resp.content[0].text : 'Не смог ответить.'
    } catch { answer = 'Ошибка при обработке запроса.' }

    await tg(answer)
    return NextResponse.json({ ok: true })
  }

  // ── Add task (default) ─────────────────────────────────────────────────────
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

  const dateStr = parsed.dueDate ? ` · до ${parsed.dueDate}` : ''
  await tg(`✅ Задача добавлена:\n${catEmoji[parsed.category] || '📌'} «${parsed.title}»${dateStr}`)

  return NextResponse.json({ ok: true })
}
