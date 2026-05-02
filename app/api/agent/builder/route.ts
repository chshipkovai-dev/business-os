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

const PROTECTED_REPOS = ['chshipkovai-dev/business-os']

async function pushToGitHub(filePath: string, content: string, commitMessage: string, repo: string) {
  if (PROTECTED_REPOS.includes(repo)) {
    throw new Error(`Builder blocked: cannot push to protected repo ${repo}`)
  }

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
  let repo = repoMatch ? repoMatch[1].trim() : (process.env.GITHUB_REPO || 'chshipkovai-dev/new')

  const jsonStart = notes.indexOf('{')
  const jsonEnd = notes.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1) {
    return { files: ['app/page.tsx'], plan: notes, repo }
  }

  try {
    const planJson = JSON.parse(notes.substring(jsonStart, jsonEnd + 1))
    if (planJson.github_repo) repo = planJson.github_repo
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

function getTesterIssues(notes: string): string {
  const match = notes.match(/\[TESTER AGENT\]\nIssues:\n([\s\S]+?)(\[|$)/)
  return match ? match[1].trim() : ''
}

function getTesterRetryCount(notes: string): number {
  const match = notes.match(/\[TESTER RETRY: (\d+)\]/)
  return match ? parseInt(match[1]) : 0
}

async function generateFile(
  title: string,
  plan: string,
  filePath: string,
  allPlannedFiles: string[],
  createdFiles: string[],
  testerIssues: string
) {
  const issuesSection = testerIssues
    ? `\nПроблемы которые нашёл Tester Agent (ОБЯЗАТЕЛЬНО исправь):\n${testerIssues}\n`
    : ''

  const prompt = `Ты — Builder Agent компании ailnex. Генерируешь ГОТОВЫЙ production код.

Стек: Next.js 15 App Router, TypeScript, Tailwind CSS.
Дизайн: тёмная тема, современный SaaS стиль. Используй inline Tailwind классы.
Цвет акцента: #00e5ff (циановый). Фон: #0a0a0f. Поверхности: #111118.

КРИТИЧЕСКИ ВАЖНО — ЗАПРЕЩЁННЫЕ ПАТТЕРНЫ (каждый из них ломает TypeScript билд):

[ИМПОРТЫ — САМОЕ ВАЖНОЕ]
- Все файлы которые будут созданы в проекте: ${allPlannedFiles.join(', ')}
- Уже созданы и доступны для импорта прямо сейчас: ${createdFiles.join(', ') || 'нет'}
- ЗАПРЕЩЕНО импортировать @/components/* файлы которых НЕТ в списке "Уже созданы"
- Если нужен компонент которого нет в "Уже созданы" — создай его INLINE прямо в этом файле
- Разрешённые npm пакеты: next, react, react-dom, lucide-react
- ЗАПРЕЩЕНО: framer-motion, @radix-ui, shadcn/ui, @hookform, zod, @supabase/supabase-js

[СТРОКИ И JSX]
- Апостроф в metadata: ВСЕГДА двойные кавычки → title: "You're In" (не одинарные)
- Апостроф в JSX тексте: → You&apos;re (не You're)
- Кавычки в JSX: → &quot; или {'"'}

[REACT 19 + TYPESCRIPT]
- useRef<T>(null) возвращает RefObject<T | null> — в интерфейсах пиши RefObject<T | null>, не RefObject<T>
- useState для union типов: если компонент ожидает 'free'|'pro'|'business', используй useState<'free'|'pro'|'business'>('pro'), не useState<string>
- В style={} можно ТОЛЬКО валидные CSS свойства (camelCase). ЗАПРЕЩЕНО: focusRingColor, ringColor, focusColor и любые другие несуществующие CSS свойства. Для focus стилей используй Tailwind классы: focus:ring-2 focus:ring-[#00e5ff]
- Нельзя использовать тип unknown как индекс — всегда String(value) или as string перед использованием в Record<string, ...>
- export type и import type для type-only экспортов в Next.js App Router

Задача: ${title}
План проекта: ${plan}
Сейчас генерируй: ${filePath}
${issuesSection}
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
  const result = safeParseJSON(raw)
  if (!result) throw new Error(`Builder: не удалось распарсить JSON для ${filePath}`)
  return result
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

  const { files: allFiles, plan, repo } = extractFilesFromPlan(task.notes || '')
  const testerIssues = getTesterIssues(task.notes || '')
  const retryCount = getTesterRetryCount(task.notes || '')

  await db.from('tasks').update({ agent_status: 'building' }).eq('id', task_id)

  await sendTelegram([
    `⚙️ <b>Builder Agent запущен</b>${retryCount > 0 ? ` (retry ${retryCount})` : ''}`,
    ``,
    `📌 <b>${task.title}</b>`,
    `📦 Репо: <code>${repo}</code>`,
    `📁 Создаю ${allFiles.length} файлов:`,
    ``,
    ...allFiles.map((f, i) => `${i + 1}. <code>${f}</code>`),
    testerIssues ? `\n⚠️ Исправляю ошибки от Tester` : '',
  ].filter(Boolean).join('\n'))

  const createdFiles: string[] = []
  const failedFiles: string[] = []

  for (const filePath of allFiles) {
    try {
      await sendTelegram(`🔨 Генерирую <code>${filePath}</code>...`)

      const result = await generateFile(task.title, plan, filePath, allFiles, createdFiles, testerIssues)
      const pushResult = await pushToGitHub(
        result.file_path as string,
        result.content as string,
        result.commit_message as string,
        repo
      )

      if (pushResult.ok) {
        createdFiles.push(filePath)
        await sendTelegram(`✓ <code>${filePath}</code>`)
      } else {
        failedFiles.push(filePath)
        await sendTelegram(`✗ <code>${filePath}</code> — ошибка GitHub`)
      }

      await new Promise(r => setTimeout(r, 1000))

    } catch (err) {
      failedFiles.push(filePath)
      await sendTelegram(`✗ <code>${filePath}</code> — ${String(err).slice(0, 80)}`)
    }
  }

  const buildSuccess = failedFiles.length === 0

  await db.from('tasks').update({
    agent_status: buildSuccess ? 'done' : 'building',
    notes: `${task.notes}\n\n[BUILDER AGENT]\nРепо: ${repo}\nСоздано: ${createdFiles.join(', ')}\nОшибки: ${failedFiles.join(', ') || 'нет'}`,
  }).eq('id', task_id)

  await sendTelegram([
    `${buildSuccess ? '✅' : '⚠️'} <b>Builder — ${buildSuccess ? 'всё готово' : 'частично'}</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `📦 <code>${repo}</code>`,
    ``,
    `✓ Создано: <b>${createdFiles.length}</b> файлов`,
    failedFiles.length > 0 ? `✗ Ошибок: ${failedFiles.length}` : '',
    ``,
    `🔗 https://github.com/${repo}`,
  ].filter(Boolean).join('\n'))

  if (buildSuccess) {
    await fetch(`${baseUrl}/api/agent/tester`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, created: createdFiles, failed: failedFiles, repo })
}
