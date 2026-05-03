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

function extractRepoAndFiles(notes: string): { repo: string, files: string[] } {
  const repoMatch = notes.match(/GITHUB_REPO:\s*([^\n]+)/)
  const repo = repoMatch ? repoMatch[1].trim() : ''

  const createdMatch = notes.match(/\[BUILDER AGENT\]\nРепо: [^\n]+\nСоздано: ([^\n]+)/)
  if (!createdMatch || createdMatch[1] === 'нет') return { repo, files: [] }

  const files = createdMatch[1].split(', ').map(f => f.trim()).filter(Boolean)
  return { repo, files }
}

function getTesterRetryCount(notes: string): number {
  const match = notes.match(/\[TESTER RETRY: (\d+)\]/)
  return match ? parseInt(match[1]) : 0
}

async function fetchFileFromGitHub(repo: string, path: string): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.content) {
    return Buffer.from(data.content, 'base64').toString('utf-8')
  }
  return null
}

async function getAllRepoTsFiles(repo: string): Promise<string[]> {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.tree as Array<{ path: string; type: string }>)
    .filter(f =>
      f.type === 'blob' &&
      (f.path.endsWith('.tsx') || f.path.endsWith('.ts')) &&
      !f.path.includes('node_modules') &&
      !f.path.includes('.d.ts') &&
      f.path !== 'next.config.ts'
    )
    .map(f => f.path)
}

function getChecklistForType(projectType: string): string {
  switch (projectType) {
    case 'n8n':
      return `
Проверь следующее для n8n workflow JSON:

[СТРУКТУРА]
1. Все referenced node names в connections реально существуют в nodes[]
2. Нет dead ends — каждая нода (кроме финальных) имеет connections
3. Условия IF имеют оба branch (true + false)
4. Циклы имеют условие выхода

[DATA FLOW]
5. Нет hardcoded credentials (должен быть {{ $credentials.X }} паттерн)
6. HTTP Request ноды имеют заполненный url
7. Нет потери данных — output одной ноды используется в следующей

[RELIABILITY]
8. Есть Error Trigger нода или IF проверка на ошибку
9. Есть Telegram/Email нода для уведомления об ошибке`

    case 'automation':
      return `
Проверь следующее для automation скрипта:

[БЕЗОПАСНОСТЬ]
1. Нет hardcoded API keys, паролей, токенов — только process.env
2. Нет sensitive data в console.log

[ОБРАБОТКА ОШИБОК]
3. Каждая async функция обёрнута в try/catch
4. HTTP ошибки проверяются: if (!res.ok) throw...
5. Нет silent failures (.catch(() => {}))`

    case 'agent':
      return `
Проверь следующее для Claude API агента:

[ANTHROPIC SDK]
1. Используется актуальный model ID: claude-sonnet-4-6, claude-haiku-4-5, или claude-opus-4-7
2. max_tokens всегда задан
3. Нет API key в коде — только process.env.ANTHROPIC_API_KEY

[КАЧЕСТВО]
4. Нет as any / as unknown
5. Все функции имеют return type`

    case 'api':
      return `
Проверь следующее для API endpoint:

[БЕЗОПАСНОСТЬ]
1. Input validation в начале функции
2. Нет SQL injection рисков
3. Нет sensitive data в response body при ошибке

[HTTP КОНВЕНЦИИ]
4. Правильные статус коды (400 для validation, 404 для not found, 500 для server error)
5. Нет hardcoded secrets`

    default: // 'web'
      return `
Проверь следующее (каждый пункт — реальная причина падения TypeScript билда или UX проблема):

[ИМПОРТЫ]
1. Все import от '@/components/X' — файл X должен существовать в списке файлов репо
2. Все import от npm пакетов — пакет должен быть в package.json dependencies
3. Запрещённые пакеты: framer-motion, @radix-ui, shadcn/ui, @hookform, zod

[СТРОКИ И JSX]
4. Апостроф внутри одинарных кавычек: title: 'You're' — ОШИБКА (нужно "You're")
5. Апостроф в JSX тексте без &apos;: <p>You're</p> — ОШИБКА (нужно You&apos;re)
6. Кавычки в JSX тексте без экранирования — ОШИБКА

[REACT 19 TYPESCRIPT]
7. useRef<T>(null) — в props интерфейсе должно быть RefObject<T | null>, не RefObject<T>
8. useState<string> передаётся в prop ожидающий union тип ('a'|'b'|'c') — ОШИБКА
9. В style={} несуществующие CSS свойства: focusRingColor, ringColor, focusColor — ОШИБКА
10. Тип unknown используется как индекс в Record<string,X>[value] без String() каста — ОШИБКА

[ACCESSIBILITY]
11. Кнопки без aria-label и без видимого текста — ОШИБКА
12. Input без связанного <label htmlFor="..."> — ОШИБКА

[MOBILE]
13. Заголовки text-4xl и больше без sm:/lg: breakpoint — ОШИБКА

Разрешённые npm пакеты: next, react, react-dom, lucide-react, tailwindcss и их @types/*.`
  }
}

async function analyzeCode(
  filesList: string[],
  filesContent: Record<string, string>,
  packageJson: string,
  projectType: string
): Promise<{ pass: boolean, issues: Array<{ file: string, problem: string, fix: string }> }> {
  const filesContentStr = Object.entries(filesContent)
    .map(([path, content]) => `=== ${path} ===\n${content}`)
    .join('\n\n')

  const checklist = getChecklistForType(projectType)

  const prompt = `Ты — Tester Agent компании Ailnex. Делаешь статический анализ кода проекта.
Тип проекта: ${projectType}

Список файлов в репо:
${filesList.join('\n')}

Содержимое файлов:
${filesContentStr}

package.json:
${packageJson}
${checklist}

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "pass": true,
  "issues": []
}

Или если есть проблемы:
{
  "pass": false,
  "issues": [
    { "file": "components/sections/Hero.tsx", "problem": "импортирует LeadModal из @/components/ui/LeadModal но файл не существует", "fix": "создать components/ui/LeadModal.tsx" },
    { "file": "package.json", "problem": "framer-motion используется в Hero.tsx но не в dependencies", "fix": "заменить framer-motion на css transitions" }
  ]
}`

  const response = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const result = safeParseJSON(raw)

  if (!result) return { pass: false, issues: [{ file: 'tester', problem: 'Tester не смог распарсить анализ', fix: 'повторить' }] }

  return result as { pass: boolean, issues: Array<{ file: string, problem: string, fix: string }> }
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

  const { repo, files: createdFiles } = extractRepoAndFiles(task.notes || '')
  const retryCount = getTesterRetryCount(task.notes || '')
  const projectTypeMatch = (task.notes || '').match(/PROJECT_TYPE:\s*([^\n]+)/)
  const projectType = projectTypeMatch ? projectTypeMatch[1].trim() : 'web'

  if (!repo) {
    return NextResponse.json({ error: 'no repo found in notes' }, { status: 400 })
  }

  await db.from('tasks').update({ agent_status: 'testing' }).eq('id', task_id)

  await sendTelegram([
    `🔍 <b>Tester Agent запущен</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `📦 <code>${repo}</code>`,
    `📁 Проверяю ${createdFiles.length} созданных + весь репо...`,
  ].join('\n'))

  // Получаем ВСЕ .ts/.tsx файлы из репо (включая zombie-файлы от старых ранов)
  const allRepoFiles = await getAllRepoTsFiles(repo)
  const filesToCheck = allRepoFiles.length > 0 ? allRepoFiles : createdFiles

  // Читаем все файлы из GitHub
  const filesContent: Record<string, string> = {}
  for (const filePath of filesToCheck) {
    const content = await fetchFileFromGitHub(repo, filePath)
    if (content) filesContent[filePath] = content
  }

  const packageJson = await fetchFileFromGitHub(repo, 'package.json') || '{}'

  const analysis = await analyzeCode([...filesToCheck, 'package.json'], filesContent, packageJson, projectType)

  if (analysis.pass) {
    await db.from('tasks').update({
      agent_status: 'tested',
      notes: `${task.notes}\n\n[TESTER AGENT]\nPass: все проверки пройдены`,
    }).eq('id', task_id)

    await sendTelegram([
      `✅ <b>Tester — всё чисто!</b>`,
      ``,
      `📌 <b>${task.title}</b>`,
      `📦 <code>${repo}</code>`,
      ``,
      `✓ Проверено файлов: <b>${filesToCheck.length}</b>`,
      `✓ Импорты: OK`,
      `✓ Зависимости: OK`,
      ``,
      `🔗 https://github.com/${repo}`,
      ``,
      `🚀 Жду деплоя...`,
    ].join('\n'))

    await fetch(`${baseUrl}/api/agent/deployment-monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, pass: true, repo })
  }

  // Есть ошибки
  const newRetryCount = retryCount + 1
  const MAX_RETRIES = 2

  const issuesList = analysis.issues
    .map((issue, i) => `${i + 1}. <code>${issue.file}</code>: ${issue.problem}`)
    .join('\n')

  if (newRetryCount > MAX_RETRIES) {
    await db.from('tasks').update({
      agent_status: 'failed',
      notes: `${task.notes}\n\n[TESTER AGENT]\nFailed после ${MAX_RETRIES} попыток\nПоследние ошибки:\n${analysis.issues.map(i => `- ${i.problem}`).join('\n')}`,
    }).eq('id', task_id)

    await sendTelegram([
      `❌ <b>Tester — задача провалена</b>`,
      ``,
      `📌 <b>${task.title}</b>`,
      `${MAX_RETRIES} попытки исправления не помогли. Нужна ручная доработка.`,
      ``,
      `<b>Ошибки:</b>`,
      ...analysis.issues.map(i => `• ${i.problem}`),
      ``,
      `🔗 https://github.com/${repo}`,
    ].join('\n'))

    return NextResponse.json({ ok: false, pass: false, failed: true, issues: analysis.issues })
  }

  // Передаём обратно Builder с описанием проблем
  const issuesForBuilder = analysis.issues
    .map(i => `- ${i.file}: ${i.problem} → ${i.fix}`)
    .join('\n')

  await db.from('tasks').update({
    agent_status: 'approved',
    notes: `${task.notes}\n\n[TESTER RETRY: ${newRetryCount}]\n[TESTER AGENT]\nIssues:\n${issuesForBuilder}`,
  }).eq('id', task_id)

  await sendTelegram([
    `⚠️ <b>Tester — найдены ошибки (попытка ${newRetryCount}/${MAX_RETRIES})</b>`,
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

  return NextResponse.json({ ok: true, pass: false, retrying: true, issues: analysis.issues })
}
