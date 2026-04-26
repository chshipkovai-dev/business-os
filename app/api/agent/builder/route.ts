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

async function pushToGitHub(filePath: string, content: string, commitMessage: string, repo: string) {
  const token = process.env.GITHUB_TOKEN

  const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
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

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
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

function extractFilesFromPlan(notes: string): { files: string[], plan: string, repo: string } {
  const repoMatch = notes.match(/GITHUB_REPO:\s*([^\n]+)/)
  const repo = repoMatch ? repoMatch[1].trim() : (process.env.GITHUB_REPO || 'chshipkovai-dev/business-os')

  const jsonStart = notes.indexOf('{')
  const jsonEnd = notes.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1) {
    return { files: ['app/page.tsx'], plan: notes, repo }
  }

  try {
    const planJson = JSON.parse(notes.substring(jsonStart, jsonEnd + 1))
    const structure = planJson.structure || {}

    const pages = (structure.pages || []).map((p: string) => {
      const path = p.split(' —')[0].trim()
      return path.startsWith('app/') ? path : `app/${path}`
    })

    const components = (structure.components || []).map((c: string) => {
      const path = c.split(' —')[0].trim()
      return path.startsWith('components/') ? path : `components/${path}`
    })

    const apiRoutes = (structure.api_routes || []).map((r: string) => {
      const path = r.split(' —')[0].trim()
      if (path.includes('/route.ts')) return path
      return path.startsWith('app/api/') ? `${path}/route.ts` : `app/api/${path}/route.ts`
    })

    const firstFile = planJson.first_file || 'app/layout.tsx'
    const allFiles = [firstFile, ...pages, ...components, ...apiRoutes]
      .filter(Boolean)
      .filter((f, i, arr) => arr.indexOf(f) === i)

    return { files: allFiles, plan: JSON.stringify(planJson, null, 2), repo }
  } catch {
    return { files: ['app/page.tsx'], plan: notes, repo }
  }
}

async function generateFile(title: string, plan: string, filePath: string, createdFiles: string[]) {
  const prompt = `Ты — Builder Agent компании ailnex. Генерируешь ГОТОВЫЙ production код.

Стек: Next.js 15 App Router, TypeScript, Tailwind CSS.
Дизайн: тёмная тема, современный SaaS стиль. Используй inline Tailwind классы.
Цвет акцента: #00e5ff (циановый). Фон: #0a0a0f. Поверхности: #111118.

Задача: ${title}
План проекта: ${plan}
Уже созданные файлы: ${createdFiles.join(', ') || 'нет'}
Сейчас генерируй: ${filePath}

Создай ПОЛНЫЙ рабочий код файла ${filePath}.
- Без заглушек, без TODO, без placeholder текста
- Реальный контент на английском языке
- Если page.tsx — красивый полный UI со всеми секциями
- Если компонент — полностью рабочий с правильными TypeScript props
- Если layout.tsx — правильные метатеги, шрифты
- Если route.ts — рабочий API handler

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "file_path": "${filePath}",
  "content": "полный код файла",
  "commit_message": "feat: краткое описание"
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

  const { files: allFiles, plan, repo } = extractFilesFromPlan(task.notes || '')

  await db.from('tasks').update({ agent_status: 'building' }).eq('id', task_id)

  await sendTelegram([
    `⚙️ <b>Builder Agent запущен</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `📦 Репо: <code>${repo}</code>`,
    `📁 Создаю ${allFiles.length} файлов:`,
    ``,
    ...allFiles.map((f, i) => `${i + 1}. <code>${f}</code>`),
  ].join('\n'))

  const createdFiles: string[] = []
  const failedFiles: string[] = []

  for (const filePath of allFiles) {
    try {
      await sendTelegram(`🔨 Генерирую <code>${filePath}</code>...`)

      const result = await generateFile(task.title, plan, filePath, createdFiles)
      const pushResult = await pushToGitHub(result.file_path, result.content, result.commit_message, repo)

      if (pushResult.ok) {
        createdFiles.push(filePath)
        await sendTelegram(`✓ <code>${filePath}</code>`)
      } else {
        failedFiles.push(filePath)
        await sendTelegram(`✗ <code>${filePath}</code> — ошибка GitHub`)
      }

      await new Promise(r => setTimeout(r, 2000))

    } catch (err) {
      failedFiles.push(filePath)
      await sendTelegram(`✗ <code>${filePath}</code> — ${String(err).slice(0, 80)}`)
    }
  }

  await db.from('tasks').update({
    agent_status: failedFiles.length === 0 ? 'done' : 'building',
    notes: `${task.notes}\n\n[BUILDER AGENT]\nРепо: ${repo}\nСоздано: ${createdFiles.join(', ')}\nОшибки: ${failedFiles.join(', ') || 'нет'}`,
  }).eq('id', task_id)

  await sendTelegram([
    `${failedFiles.length === 0 ? '✅' : '⚠️'} <b>Builder — ${failedFiles.length === 0 ? 'всё готово' : 'частично'}</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `📦 <code>${repo}</code>`,
    ``,
    `✓ Создано: <b>${createdFiles.length}</b> файлов`,
    failedFiles.length > 0 ? `✗ Ошибок: ${failedFiles.length}` : '',
    ``,
    `🔗 https://github.com/${repo}`,
  ].filter(Boolean).join('\n'))

  return NextResponse.json({ ok: true, created: createdFiles, failed: failedFiles, repo })
}
