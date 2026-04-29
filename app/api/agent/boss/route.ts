import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
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

const BOSS_PROMPT = `Ты — Boss Agent компании ailnex. Получаешь задачу и быстро определяешь тип и сложность.

Задача: {TITLE}
Заметки: {NOTES}

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "agent": "builder" | "designer" | "marketing",
  "complexity": "simple" | "complex",
  "reason": "одно предложение почему",
  "estimate": "например: 1 час или 3 дня"
}

simple = мелкий фикс, простая страница, небольшое изменение
complex = новый продукт, сложная интеграция, много файлов`

export async function POST() {
  const db = getDB()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://business-os-alpha-rust.vercel.app'

  const { data: tasks, error } = await db
    .from('tasks')
    .select('*')
    .eq('agent_status', 'pending')
    .eq('done', false)
    .eq('category', 'work')
    .order('created_at', { ascending: true })
    .limit(3)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!tasks || tasks.length === 0) return NextResponse.json({ ok: true, message: 'Нет новых задач' })

  const results = []

  for (const task of tasks) {
    await db.from('tasks').update({ agent_status: 'picked_up' }).eq('id', task.id)

    const repoMatch = task.notes?.match(/GITHUB_REPO:\s*([^\n]+)/)
    const githubRepo = repoMatch ? repoMatch[1].trim() : 'chshipkovai-dev/new'

    const prompt = BOSS_PROMPT
      .replace('{TITLE}', task.title)
      .replace('{NOTES}', task.notes || 'нет')

    try {
      const response = await ai.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      const decision = safeParseJSON(raw)
      if (!decision) throw new Error('Boss: не удалось распарсить JSON от Claude')

      const agentEmoji: Record<string, string> = { builder: '⚙️', designer: '🎨', marketing: '📣' }
      const agent = String(decision.agent ?? 'builder')
      const estimate = String(decision.estimate ?? '?')
      const reason = String(decision.reason ?? '')

      if (decision.complexity === 'complex') {
        await db.from('tasks').update({ agent_status: 'planning' }).eq('id', task.id)

        await fetch(`${baseUrl}/api/agent/planning`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: task.id,
            title: task.title,
            notes: task.notes,
            category: task.category,
          }),
        }).catch(() => {})

        await sendTelegram([
          `🧠 <b>Boss Agent</b>`,
          ``,
          `📌 <b>${task.title}</b>`,
          `${agentEmoji[agent] ?? '⚙️'} Сложная задача → Planning Agent`,
          `⏱ ${estimate}`,
          ``,
          `${reason}`,
        ].join('\n'))

        results.push({ task: task.title, complexity: 'complex', route: 'planning' })

      } else {
        // Простая → создаём минимальный план и вызываем Builder напрямую
        const minimalPlan = {
          project_name: task.title,
          github_repo: githubRepo,
          goal: task.title,
          structure: {
            pages: ['app/page.tsx'],
            components: [],
            api_routes: [],
            db_tables: [],
          },
          first_file: 'app/page.tsx',
        }

        await db.from('tasks').update({
          agent_status: 'approved',
          notes: `GITHUB_REPO: ${githubRepo}\n[PLANNING AGENT]\n${JSON.stringify(minimalPlan, null, 2)}`,
        }).eq('id', task.id)

        await sendTelegram([
          `🧠 <b>Boss Agent</b>`,
          ``,
          `📌 <b>${task.title}</b>`,
          `${agentEmoji[agent] ?? '⚙️'} Простая задача → Builder`,
          `📦 Репо: <code>${githubRepo}</code>`,
          `⏱ ${estimate}`,
        ].join('\n'))

        await fetch(`${baseUrl}/api/agent/builder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: task.id }),
        }).catch(() => {})

        results.push({ task: task.title, complexity: 'simple', route: 'builder' })
      }

    } catch (err) {
      await db.from('tasks').update({ agent_status: 'pending' }).eq('id', task.id)
      results.push({ task: task.title, ok: false, error: String(err) })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
