import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { safeParseJSON } from '../_utils'
import { AILNEX_KNOWLEDGE } from '../_knowledge/ailnex'

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

function getProjectType(notes: string): string {
  const match = notes.match(/PROJECT_TYPE:\s*([^\n]+)/)
  return match ? match[1].trim() : 'web'
}

function getReviewerRetryCount(notes: string): number {
  const match = notes.match(/\[REVIEWER RETRY: (\d+)\]/)
  return match ? parseInt(match[1]) : 0
}

async function fetchFileFromGitHub(repo: string, path: string): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.content) return Buffer.from(data.content, 'base64').toString('utf-8')
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
LOGIC (5 пунктов)
1. Workflow решает поставленную задачу end-to-end (нет незавершённых веток)
2. Есть error handling (Error Trigger нода или IF на ошибку)
3. Нет dead ends — каждая нода имеет хотя бы один connection
4. Условия IF имеют оба branch (true + false)
5. Циклы имеют условие выхода

DATA FLOW (5 пунктов)
6. Данные между нодами корректно mapped (нет undefined полей)
7. Нет hardcoded credentials — используются n8n Credentials
8. HTTP Request методы корректны (GET для чтения, POST для создания)
9. JSON парсинг явный там где нужен
10. Нет потери данных между нодами

RELIABILITY (5 пунктов)
11. Retry logic на HTTP запросы
12. Logging важных шагов (Set нода с описанием)
13. Есть нода для уведомления об ошибке (Telegram/Email)
14. Идемпотентность (повторный запуск не дублирует данные)
15. Timeout на внешние HTTP запросы`

    case 'automation':
    case 'api':
      return `
ERROR HANDLING (5 пунктов)
1. Каждая async функция — try/catch с конкретной обработкой (не пустой catch)
2. HTTP ошибки проверяются: if (!res.ok) throw new Error(...)
3. Нет silent failures (.catch(() => {}))
4. Ошибки логируются с контекстом (что за операция, какие данные)
5. Fallback для критических операций

CODE QUALITY (5 пунктов)
6. Нет hardcoded credentials — только process.env
7. Функции имеют типы параметров и return type
8. Нет any типов без обоснования
9. Длина функции ≤ 50 строк — разбить если больше
10. Понятные имена переменных (не a, b, tmp, data2)

SECURITY (5 пунктов)
11. Input validation перед обработкой пользовательских данных
12. Нет SQL injection рисков (параметризованные запросы)
13. Rate limiting если публичный endpoint
14. Нет sensitive data в logs
15. CORS корректно настроен если нужен`

    default: // 'web'
      return `
CODE QUALITY (5 пунктов)
1. Файлы ≤ 250 строк — если больше, указать как разбить
2. Нет дублирования JSX-блоков (3+ одинаковых блока → вынести в компонент)
3. Данные (тексты, цены, фичи) вынесены из JSX в массивы/объекты
4. Нет inline onMouseEnter/Leave обработчиков — заменить на Tailwind hover:
5. Нет захардкоженных контактов (email, URL) прямо в JSX — вынести в константы

TYPESCRIPT (5 пунктов)
6. Нет as any / as unknown без явного обоснования
7. Props интерфейсы объявлены для всех компонентов с параметрами
8. Event handlers типизированы (e: React.MouseEvent, e: React.ChangeEvent<HTMLInputElement>)
9. Нет неиспользуемых imports
10. Нет data?.field?.field без type guard или type assertion

ACCESSIBILITY (5 пунктов)
11. Все интерактивные кнопки — aria-label если нет видимого текста внутри
12. Все <input> — связаны с <label htmlFor="...">
13. Heading hierarchy: один <h1> на страницу, <h2>→<h3> строго по порядку
14. Navigation обёрнута в <nav> тег
15. Все <Image> — осмысленный alt атрибут (не "image" или "")

MOBILE (5 пунктов)
16. Заголовки ≥ text-4xl имеют sm: и lg: breakpoint (text-2xl sm:text-4xl lg:text-6xl)
17. Grid не прыгает с 1 на 3 без промежуточного sm:grid-cols-2
18. Кнопки и ссылки min-h-[44px] (Apple HIG tap target)
19. Нет overflow-x на мобиле (проверить контейнеры)
20. Padding: минимум px-4 на мобиле

CONVERSION (5 пунктов)
21. CTA кнопка видна без скролла на мобиле (выше fold)
22. Headline конкретна — описывает результат, не функцию ("Reply to reviews automatically", не "Manage reviews")
23. Social proof (отзывы, цифры, логотипы) рядом с CTA
24. Форма содержит минимум полей (только email для free tier)
25. На одном экране не больше одной primary CTA кнопки`
  }
}

async function reviewCode(
  filesContent: Record<string, string>,
  projectType: string,
  taskTitle: string
): Promise<{ pass: boolean, issues: Array<{ file: string, problem: string, fix: string, priority: 'critical' | 'major' | 'minor' }> }> {
  const filesContentStr = Object.entries(filesContent)
    .map(([path, content]) => `=== ${path} ===\n${content}`)
    .join('\n\n')

  const checklist = getChecklistForType(projectType)

  const prompt = `${AILNEX_KNOWLEDGE}

---

Ты — Senior Reviewer Agent компании Ailnex. Делаешь code review сгенерированного кода.
Тип проекта: ${projectType}
Задача: ${taskTitle}

Содержимое файлов:
${filesContentStr}

Проверь по чеклисту (фокус на качество, не на compile ошибки):
${checklist}

Правила оценки:
- "critical" = блокирует deploy или сильно вредит конверсии/UX (сломанная accessibility, нет мобильного breakpoint на заголовке, CTA не видна)
- "major" = заметная проблема качества (файл 400+ строк, нет aria-label на кнопке формы)
- "minor" = небольшое улучшение (переименовать переменную, вынести данные)

Возвращай только CRITICAL и MAJOR проблемы (minor игнорируй).
Если critical/major проблем нет — pass: true.
Максимум 5 issues в ответе (самые важные).

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "pass": true,
  "issues": []
}

Или если есть проблемы:
{
  "pass": false,
  "issues": [
    { "file": "app/page.tsx", "problem": "h1 отсутствует — есть только h2", "fix": "переименовать первый заголовок секции Hero в h1", "priority": "critical" },
    { "file": "components/sections/Pricing.tsx", "problem": "файл 380 строк, компонент PricingCard дублируется 3 раза", "fix": "вынести PricingCard в отдельную функцию внутри файла", "priority": "major" }
  ]
}`

  const response = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const result = safeParseJSON(raw)

  if (!result) return { pass: false, issues: [{ file: 'reviewer', problem: 'Reviewer не смог распарсить анализ', fix: 'повторить', priority: 'critical' }] }

  return result as { pass: boolean, issues: Array<{ file: string, problem: string, fix: string, priority: 'critical' | 'major' | 'minor' }> }
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
  const projectType = getProjectType(task.notes || '')
  const retryCount = getReviewerRetryCount(task.notes || '')

  if (!repo) return NextResponse.json({ error: 'no repo found in notes' }, { status: 400 })

  await db.from('tasks').update({ agent_status: 'reviewing' }).eq('id', task_id)

  await sendTelegram([
    `🔎 <b>Reviewer Agent запущен</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `📦 <code>${repo}</code>`,
    `🔧 Тип: <code>${projectType}</code>`,
    `📁 Проверяю ${createdFiles.length} файлов...`,
  ].join('\n'))

  const allRepoFiles = await getAllRepoTsFiles(repo)
  const filesToCheck = allRepoFiles.length > 0 ? allRepoFiles : createdFiles

  const filesContent: Record<string, string> = {}
  for (const filePath of filesToCheck) {
    const content = await fetchFileFromGitHub(repo, filePath)
    if (content) filesContent[filePath] = content
  }

  const review = await reviewCode(filesContent, projectType, task.title)

  if (review.pass) {
    await db.from('tasks').update({
      notes: `${task.notes}\n\n[REVIEWER AGENT]\nPass: code review пройден`,
    }).eq('id', task_id)

    await sendTelegram([
      `✅ <b>Reviewer — код качественный!</b>`,
      ``,
      `📌 <b>${task.title}</b>`,
      `📦 <code>${repo}</code>`,
      ``,
      `✓ Проверено файлов: <b>${filesToCheck.length}</b>`,
      `✓ Code quality: OK`,
      `✓ Accessibility: OK`,
      `✓ Mobile: OK`,
      ``,
      `🧪 Передаю Tester...`,
    ].join('\n'))

    await fetch(`${baseUrl}/api/agent/tester`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, pass: true, repo })
  }

  // Есть проблемы
  const MAX_RETRIES = 1
  const newRetryCount = retryCount + 1

  const issuesList = review.issues
    .map((issue, i) => {
      const emoji = issue.priority === 'critical' ? '🔴' : '🟡'
      return `${i + 1}. ${emoji} <code>${issue.file}</code>: ${issue.problem}`
    })
    .join('\n')

  if (newRetryCount > MAX_RETRIES) {
    // После одной попытки исправления — пропускаем дальше с предупреждением
    await db.from('tasks').update({
      notes: `${task.notes}\n\n[REVIEWER AGENT]\nWarning: найдены проблемы качества, передано дальше\n${review.issues.map(i => `- ${i.problem}`).join('\n')}`,
    }).eq('id', task_id)

    await sendTelegram([
      `⚠️ <b>Reviewer — проблемы остались, передаю Tester</b>`,
      ``,
      `📌 <b>${task.title}</b>`,
      `Одна попытка исправления не помогла. Передаю дальше.`,
      ``,
      `<b>Нерешённые проблемы:</b>`,
      ...review.issues.map(i => `• ${i.problem}`),
    ].join('\n'))

    await fetch(`${baseUrl}/api/agent/tester`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, pass: false, skipped: true, issues: review.issues })
  }

  // Передаём Builder на исправление
  const issuesForBuilder = review.issues
    .map(i => `- ${i.file}: ${i.problem} → ${i.fix}`)
    .join('\n')

  await db.from('tasks').update({
    agent_status: 'approved',
    notes: `${task.notes}\n\n[REVIEWER RETRY: ${newRetryCount}]\n[REVIEWER AGENT]\nIssues:\n${issuesForBuilder}`,
  }).eq('id', task_id)

  await sendTelegram([
    `⚠️ <b>Reviewer — найдены проблемы (попытка ${newRetryCount}/${MAX_RETRIES})</b>`,
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

  return NextResponse.json({ ok: true, pass: false, retrying: true, issues: review.issues })
}
