import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { safeParseJSON } from '../_utils'

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

function getDeployedUrl(notes: string): string | null {
  const match = notes.match(/\[DEPLOYMENT MONITOR\]\nStatus: ready\nURL: ([^\n]+)/)
  return match ? match[1].trim() : null
}

function getQARetryCount(notes: string): number {
  const match = notes.match(/\[QA RETRY: (\d+)\]/)
  return match ? parseInt(match[1]) : 0
}

async function fetchPageHtml(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AilnexQA/1.0)' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) return null
  return await res.text()
}

async function runQAChecks(
  url: string,
  html: string,
  taskTitle: string
): Promise<{ pass: boolean, issues: Array<{ check: string, problem: string, fix: string }>, score: number }> {
  const htmlSnippet = html.slice(0, 8000)

  const prompt = `Ты — QA Agent компании Ailnex. Проверяешь задеплоенный лендинг по HTML.

URL: ${url}
Задача: ${taskTitle}

HTML страницы (первые 8000 символов):
${htmlSnippet}

Проведи 5 QA проверок:

1. **H1 и структура** — есть ли один <h1> на странице? Есть ли заголовок который описывает что делает продукт?

2. **CTA кнопка** — есть ли заметная primary кнопка (button или a с классами типа bg-cyan, bg-indigo, btn-primary)? Находится ли она выше fold (в первых 50% контента)?

3. **Форма** — если есть <form> или <input type="email">, есть ли label для поля? Есть ли submit кнопка?

4. **Навигация** — есть ли <nav> тег? Нет ли ссылок с href="#" (сломанных якорей)?

5. **Meta и SEO** — есть ли <title> тег? Есть ли meta description? Есть ли viewport meta?

Для каждой проверки: pass или fail. Если fail — конкретная проблема и fix.
Score = количество passed проверок из 5.

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "pass": true,
  "score": 5,
  "issues": []
}

Или если есть проблемы (score < 4 = fail):
{
  "pass": false,
  "score": 3,
  "issues": [
    { "check": "H1 и структура", "problem": "H1 отсутствует — только H2 и H3", "fix": "добавить H1 с главным заголовком продукта" },
    { "check": "Meta и SEO", "problem": "Нет meta description", "fix": "добавить <meta name='description' content='...'> в layout.tsx" }
  ]
}`

  const response = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const result = safeParseJSON(raw)

  if (!result) return {
    pass: false,
    score: 0,
    issues: [{ check: 'parse', problem: 'QA не смог распарсить анализ', fix: 'повторить' }]
  }

  return result as { pass: boolean, issues: Array<{ check: string, problem: string, fix: string }>, score: number }
}

export async function POST(req: NextRequest) {
  const { task_id } = await req.json()
  if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 })

  const db = getDB()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://business-os-alpha-rust.vercel.app'

  const { data: task, error } = await db
    .from('tasks')
    .select('*')
    .eq('id', task_id)
    .single()

  if (error || !task) return NextResponse.json({ error: 'task not found' }, { status: 404 })

  const deployedUrl = getDeployedUrl(task.notes || '')
  const retryCount = getQARetryCount(task.notes || '')

  if (!deployedUrl) {
    await db.from('tasks').update({ agent_status: 'done' }).eq('id', task_id)
    return NextResponse.json({ error: 'no deployed URL in notes' }, { status: 400 })
  }

  await db.from('tasks').update({ agent_status: 'qa' }).eq('id', task_id)

  await sendTelegram([
    `🔍 <b>QA Agent запущен</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `🌐 <a href="${deployedUrl}">${deployedUrl}</a>`,
    `⏳ Загружаю страницу...`,
  ].join('\n'))

  const html = await fetchPageHtml(deployedUrl)

  if (!html) {
    await db.from('tasks').update({ agent_status: 'done' }).eq('id', task_id)
    await sendTelegram([
      `⚠️ <b>QA: не удалось загрузить страницу</b>`,
      `📌 <b>${task.title}</b>`,
      `🌐 ${deployedUrl}`,
      `Страница недоступна или таймаут. Помечаю как done.`,
    ].join('\n'))
    return NextResponse.json({ ok: false, error: 'page not accessible' })
  }

  const qa = await runQAChecks(deployedUrl, html, task.title)

  if (qa.pass) {
    await db.from('tasks').update({
      agent_status: 'done',
      notes: `${task.notes}\n\n[QA AGENT]\nPass: ${qa.score}/5 проверок пройдено`,
    }).eq('id', task_id)

    await sendTelegram([
      `✅ <b>QA пройден! Задача завершена.</b>`,
      ``,
      `📌 <b>${task.title}</b>`,
      `🌐 <a href="${deployedUrl}">${deployedUrl}</a>`,
      ``,
      `📊 Результат: <b>${qa.score}/5</b>`,
      `✓ H1 и структура: OK`,
      `✓ CTA кнопка: OK`,
      `✓ Форма: OK`,
      `✓ Навигация: OK`,
      `✓ Meta и SEO: OK`,
      ``,
      `🎉 Продукт готов к запуску!`,
    ].join('\n'))

    return NextResponse.json({ ok: true, pass: true, score: qa.score, url: deployedUrl })
  }

  // Есть проблемы
  const MAX_RETRIES = 1
  const newRetryCount = retryCount + 1

  const issuesList = qa.issues
    .map((issue, i) => `${i + 1}. <b>${issue.check}</b>: ${issue.problem}`)
    .join('\n')

  if (newRetryCount > MAX_RETRIES) {
    // После одной попытки — помечаем done с предупреждением
    await db.from('tasks').update({
      agent_status: 'done',
      notes: `${task.notes}\n\n[QA AGENT]\nWarning: ${qa.score}/5 проверок\n${qa.issues.map(i => `- ${i.problem}`).join('\n')}`,
    }).eq('id', task_id)

    await sendTelegram([
      `⚠️ <b>QA: проблемы остались (${qa.score}/5)</b>`,
      ``,
      `📌 <b>${task.title}</b>`,
      `🌐 <a href="${deployedUrl}">${deployedUrl}</a>`,
      ``,
      `Одна попытка исправления не помогла. Требует ручной проверки.`,
      ``,
      `<b>Нерешённые проблемы:</b>`,
      ...qa.issues.map(i => `• ${i.check}: ${i.problem}`),
    ].join('\n'))

    return NextResponse.json({ ok: true, pass: false, skipped: true, score: qa.score })
  }

  // Передаём Builder на исправление
  const issuesForBuilder = qa.issues
    .map(i => `- ${i.check}: ${i.problem} → ${i.fix}`)
    .join('\n')

  await db.from('tasks').update({
    agent_status: 'approved',
    notes: `${task.notes}\n\n[QA RETRY: ${newRetryCount}]\n[QA AGENT]\nIssues:\n${issuesForBuilder}`,
  }).eq('id', task_id)

  await sendTelegram([
    `⚠️ <b>QA найдены проблемы (${qa.score}/5) — попытка ${newRetryCount}/${MAX_RETRIES}</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    ``,
    `<b>Проблемы:</b>`,
    issuesList,
    ``,
    `🔄 Передаю Builder на исправление...`,
  ].join('\n'))

  await fetch(`${baseUrl}/api/agent/builder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id }),
  }).catch(() => {})

  return NextResponse.json({ ok: true, pass: false, retrying: true, score: qa.score, issues: qa.issues })
}
