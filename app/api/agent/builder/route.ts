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

async function pushToGitHub(filePath: string, content: string, commitMessage: string) {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO || 'chshipkovai-dev/business-os'

  const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  let sha: string | undefined
  if (checkRes.ok) {
    const existing = await checkRes.json()
    sha = existing.sha
  }

  const body: Record<string, unknown> = {
    message: commitMessage,
    content: Buffer.from(content).toString('base64'),
  }
  if (sha) body.sha = sha

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return { ok: res.ok, data }
}

const BUILDER_PROMPT = `Ты — Builder Agent компании ailnex. Получаешь план от Planning Agent и генерируешь ГОТОВЫЙ код.

Стек: Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase, Claude API.
Стиль кода: такой же как в проекте — inline styles через style={{}}, CSS переменные (--accent, --bg-surface, --text-primary и тд), font-family: var(--font-mono) и var(--font-display).

Задача: {TITLE}
План: {PLAN}
Первый файл для создания: {FIRST_FILE}

Сгенерируй содержимое файла {FIRST_FILE}.
Это должен быть ПОЛНЫЙ, РАБОЧИЙ код — без заглушек, без TODO, без placeholder текста.
Используй реальные данные из плана.

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "file_path": "путь к файлу относительно корня проекта",
  "content": "полный код файла",
  "commit_message": "feat: краткое описание что сделано",
  "summary": "2-3 предложения что создано и как это работает",
  "next_files": ["следующие файлы которые нужно создать", "в порядке приоритета"]
}`

export async function POST(req: NextRequest) {
  const { task_id } = await req.json()
  if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 })

  const db = getDB()

  const { data: task, error } = await db
    .from('tasks')
    .select('*')
    .eq('id', task_id)
    .single()

  if (error || !task) return NextResponse.json({ error: 'task not found' }, { status: 404 })

  let plan = task.notes || ''
  let firstFile = 'app/page.tsx'

  try {
    const planMatch = plan.match(/\[PLANNING AGENT\]\n([\s\S]+)/)
    if (planMatch) {
      const planJson = JSON.parse(planMatch[1])
      firstFile = planJson.first_file || firstFile
      plan = JSON.stringify(planJson, null, 2)
    }
  } catch { /* используем notes как есть */ }

  await db.from('tasks').update({ agent_status: 'building' }).eq('id', task_id)

  await sendTelegram([
    `⚙️ <b>Builder Agent запущен</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `🔨 Генерирую код...`,
  ].join('\n'))

  const prompt = BUILDER_PROMPT
    .replace('{TITLE}', task.title)
    .replace('{PLAN}', plan)
    .replace('{FIRST_FILE}', firstFile)
    .replace('{FIRST_FILE}', firstFile)

  try {
    const response = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const text = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const result = JSON.parse(text)

    const pushResult = await pushToGitHub(
      result.file_path,
      result.content,
      result.commit_message
    )

    if (!pushResult.ok) {
      throw new Error(`GitHub push failed: ${JSON.stringify(pushResult.data)}`)
    }

    await db.from('tasks').update({
      agent_status: 'done',
      notes: `${task.notes}\n\n[BUILDER AGENT]\nФайл: ${result.file_path}\n${result.summary}\n\nСледующие файлы:\n${result.next_files.join('\n')}`,
    }).eq('id', task_id)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://business-os-alpha-rust.vercel.app'

    await sendTelegram([
      `✅ <b>Builder Agent — готово!</b>`,
      ``,
      `📌 <b>${task.title}</b>`,
      ``,
      `📄 Файл создан: <code>${result.file_path}</code>`,
      ``,
      `${result.summary}`,
      ``,
      `<b>Следующие файлы:</b>`,
      ...result.next_files.slice(0, 3).map((f: string) => `• <code>${f}</code>`),
      ``,
      `🚀 Vercel деплоит автоматически...`,
      `🔗 ${appUrl}`,
    ].join('\n'))

    return NextResponse.json({ ok: true, file: result.file_path, summary: result.summary })

  } catch (err) {
    await db.from('tasks').update({ agent_status: 'approved' }).eq('id', task_id)

    await sendTelegram([
      `❌ <b>Builder Agent — ошибка</b>`,
      ``,
      `${String(err)}`,
    ].join('\n'))

    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
