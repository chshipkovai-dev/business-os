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

async function pushToGitHub(filePath: string, content: string, commitMessage: string, repo?: string) {
  const token = process.env.GITHUB_TOKEN
  const targetRepo = repo || process.env.GITHUB_REPO || 'chshipkovai-dev/business-os'

  const checkRes = await fetch(`https://api.github.com/repos/${targetRepo}/contents/${filePath}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' },
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

  const res = await fetch(`https://api.github.com/repos/${targetRepo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return { ok: res.ok, data: await res.json() }
}

async function generateFile(title: string, plan: string, filePath: string, createdFiles: string[]) {
  const prompt = `Ты — Builder Agent компании ailnex. Генерируешь ГОТОВЫЙ production код.

Стек: Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase, Claude API.
Стиль: inline styles через style={{}}, CSS переменные (--accent, --bg-surface, --text-primary, --text-muted, --border, --bg-elevated), font-family: var(--font-mono) и var(--font-display).
Цвета акцентов: --accent = #00e5ff (циановый), --success = #10b981, --warning = #f59e0b.

Задача: ${title}
План: ${plan}
Уже созданные файлы: ${createdFiles.join(', ') || 'нет'}
Сейчас генерируй: ${filePath}

Создай ПОЛНЫЙ рабочий код файла ${filePath}.
Без заглушек, без TODO, без placeholder. Реальный контент.
Если это page.tsx — красивый UI в стиле ailnex дашборда.
Если это компонент — полностью рабочий с правильными props.
Если это API route — рабочий handler.

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "file_path": "${filePath}",
  "content": "полный код файла",
  "commit_message": "feat: описание"
}`

  const response = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const text = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(text)
}

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
  let allFiles: string[] = []
  let taskRepo: string | undefined

  try {
    const planMatch = plan.match(/\[PLANNING AGENT\]\n([\s\S]+?)(?:\[|$)/)
    if (planMatch) {
      const planJson = JSON.parse(planMatch[1].trim())
      const structure = planJson.structure || {}
      // Репо может быть указано в плане как github_repo
      if (planJson.github_repo) taskRepo = planJson.github_repo
      allFiles = [
        planJson.first_file,
        ...(structure.pages || []).map((p: string) => `app/${p.replace(/^\//, '')}`),
        ...(structure.components || []).map((c: string) => `components/${c}`),
        ...(structure.api_routes || []).map((r: string) => `app/api/${r.replace(/^\/api\//, '')}/route.ts`),
      ].filter(Boolean).filter((f, i, arr) => arr.indexOf(f) === i)
      plan = JSON.stringify(planJson, null, 2)
    }
    // Также ищем GITHUB_REPO: в notes напрямую
    const repoMatch = task.notes?.match(/GITHUB_REPO:\s*(\S+)/)
    if (repoMatch) taskRepo = repoMatch[1]
  } catch { /* используем notes */ }

  if (allFiles.length === 0) allFiles = ['app/page.tsx']

  await db.from('tasks').update({ agent_status: 'building' }).eq('id', task_id)

  await sendTelegram([
    `⚙️ <b>Builder Agent запущен</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `📁 Создаю ${allFiles.length} файлов по очереди...`,
    ``,
    ...allFiles.map((f, i) => `${i + 1}. <code>${f}</code>`),
  ].join('\n'))

  const createdFiles: string[] = []
  const failedFiles: string[] = []

  for (const filePath of allFiles) {
    try {
      await sendTelegram(`🔨 Генерирую <code>${filePath}</code>...`)

      const result = await generateFile(task.title, plan, filePath, createdFiles)
      const pushResult = await pushToGitHub(result.file_path, result.content, result.commit_message, taskRepo)

      if (pushResult.ok) {
        createdFiles.push(filePath)
        await sendTelegram(`✓ <code>${filePath}</code> — готово`)
      } else {
        failedFiles.push(filePath)
        await sendTelegram(`✗ <code>${filePath}</code> — ошибка GitHub`)
      }

      await new Promise(r => setTimeout(r, 2000))

    } catch (err) {
      failedFiles.push(filePath)
      await sendTelegram(`✗ <code>${filePath}</code> — ${String(err).slice(0, 100)}`)
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://business-os-alpha-rust.vercel.app'

  await db.from('tasks').update({
    agent_status: failedFiles.length === 0 ? 'done' : 'building',
    notes: `${task.notes}\n\n[BUILDER AGENT]\nСоздано: ${createdFiles.join(', ')}\nОшибки: ${failedFiles.join(', ') || 'нет'}`,
  }).eq('id', task_id)

  await sendTelegram([
    `${failedFiles.length === 0 ? '✅' : '⚠️'} <b>Builder Agent — ${failedFiles.length === 0 ? 'всё готово' : 'частично готово'}</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    ``,
    `✓ Создано файлов: <b>${createdFiles.length}</b>`,
    ...createdFiles.map(f => `  • <code>${f}</code>`),
    failedFiles.length > 0 ? `\n✗ Ошибки: ${failedFiles.length}` : '',
    ...failedFiles.map(f => `  • <code>${f}</code>`),
    ``,
    `🚀 Vercel деплоит автоматически`,
    `🔗 ${appUrl}`,
  ].filter(Boolean).join('\n'))

  return NextResponse.json({ ok: true, created: createdFiles, failed: failedFiles })
}
