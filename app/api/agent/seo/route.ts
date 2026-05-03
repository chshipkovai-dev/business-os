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

function getRepo(notes: string): string {
  const match = notes.match(/GITHUB_REPO:\s*([^\n]+)/)
  return match ? match[1].trim() : ''
}

async function fetchFileFromGitHub(repo: string, path: string): Promise<{ content: string, sha: string } | null> {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.content) return null
  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
  }
}

async function pushToGitHub(repo: string, filePath: string, content: string, sha: string, commitMessage: string) {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      sha,
    }),
  })
  return res.ok
}

async function generateSeoLayout(
  currentLayout: string,
  pageContent: string,
  taskTitle: string,
  repo: string
): Promise<{ layout: string, title: string, description: string } | null> {
  const projectName = repo.split('/').pop() ?? repo

  const prompt = `Ты — SEO Agent компании Ailnex. Улучшаешь metadata Next.js лендинга.

Задача: ${taskTitle}
Проект: ${projectName}

Текущий layout.tsx:
${currentLayout}

Контент главной страницы (page.tsx):
${pageContent.slice(0, 3000)}

Сгенерируй улучшенный layout.tsx с правильными SEO метатегами:

ОБЯЗАТЕЛЬНО добавить/улучшить:
1. title — конкретный, описывает продукт + ключевое слово (не "My App")
2. description — 150-160 символов, описывает что делает продукт и кому полезен
3. Open Graph: og:title, og:description, og:type="website"
4. Twitter Card: twitter:card="summary_large_image", twitter:title, twitter:description
5. viewport (если нет)
6. robots: "index, follow"
7. canonical URL через метатег (используй NEXT_PUBLIC_APP_URL или "#")

НЕ МЕНЯТЬ: шрифты, классы body, providers, children — только metadata объект.
Используй Next.js Metadata API (не <Head> тег).

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "layout": "полный код layout.tsx",
  "title": "итоговый title",
  "description": "итоговое description"
}`

  const response = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return safeParseJSON(raw) as { layout: string, title: string, description: string } | null
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

  const repo = getRepo(task.notes || '')
  if (!repo) return NextResponse.json({ error: 'no repo in notes' }, { status: 400 })

  await db.from('tasks').update({ agent_status: 'seo' }).eq('id', task_id)

  await sendTelegram([
    `🔎 <b>SEO Agent запущен</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `📦 <code>${repo}</code>`,
    `⏳ Улучшаю metadata...`,
  ].join('\n'))

  const layoutFile = await fetchFileFromGitHub(repo, 'app/layout.tsx')
  const pageFile = await fetchFileFromGitHub(repo, 'app/page.tsx')

  if (!layoutFile) {
    await sendTelegram([
      `⚠️ <b>SEO: layout.tsx не найден</b>`,
      `📌 <b>${task.title}</b>`,
      `Передаю дальше без SEO...`,
    ].join('\n'))

    await fetch(`${baseUrl}/api/agent/deployment-monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, skipped: true })
  }

  const pageContent = pageFile?.content ?? ''
  const result = await generateSeoLayout(layoutFile.content, pageContent, task.title, repo)

  if (!result) {
    await sendTelegram(`⚠️ <b>SEO: не удалось сгенерировать metadata — передаю дальше</b>`)

    await fetch(`${baseUrl}/api/agent/deployment-monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, skipped: true })
  }

  const pushed = await pushToGitHub(
    repo,
    'app/layout.tsx',
    result.layout,
    layoutFile.sha,
    'seo: improve metadata, OG tags, Twitter Card'
  )

  await db.from('tasks').update({
    notes: `${task.notes}\n\n[SEO AGENT]\nTitle: ${result.title}\nDescription: ${result.description}`,
  }).eq('id', task_id)

  await sendTelegram([
    `✅ <b>SEO Agent — metadata улучшена!</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `📦 <code>${repo}</code>`,
    ``,
    `📝 Title: <i>${result.title}</i>`,
    `📝 Description: <i>${result.description}</i>`,
    ``,
    pushed ? `✓ layout.tsx обновлён` : `⚠️ Не удалось обновить layout.tsx`,
    ``,
    `🚀 Жду деплоя...`,
  ].join('\n'))

  await fetch(`${baseUrl}/api/agent/deployment-monitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id }),
  }).catch(() => {})

  return NextResponse.json({ ok: true, title: result.title, description: result.description })
}
