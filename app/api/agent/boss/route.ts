import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
Категория: {CATEGORY}

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "agent": "builder" | "designer" | "marketing",
  "complexity": "simple" | "complex",
  "reason": "одно предложение почему этот агент и эта сложность",
  "estimate": "быстрая оценка: например 1 час или 3 дня"
}

simple = поменять цвет, добавить текст, мелкий фикс — идёт напрямую к Builder
complex = новая страница, новый компонент, интеграция — идёт через Planning Agent сначала`

export async function POST() {
  const db = getDB()

  const { data: tasks, error } = await db
    .from('tasks')
    .select('*')
    .eq('agent_status', 'pending')
    .eq('done', false)
    .eq('category', 'work')
    .order('created_at', { ascending: true })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!tasks || tasks.length === 0) return NextResponse.json({ ok: true, message: 'Нет новых задач' })

  const results = []

  for (const task of tasks) {
    await db.from('tasks').update({ agent_status: 'picked_up' }).eq('id', task.id)

    const prompt = BOSS_PROMPT
      .replace('{TITLE}', task.title)
      .replace('{NOTES}', task.notes || 'нет')
      .replace('{CATEGORY}', task.category)

    try {
      const response = await ai.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      const text = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const decision = JSON.parse(text)

      const agentEmoji: Record<string, string> = { builder: '⚙️', designer: '🎨', marketing: '📣' }

      if (decision.complexity === 'complex') {
        await db.from('tasks').update({ agent_status: 'planning' }).eq('id', task.id)

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://business-os-alpha-rust.vercel.app'
        await fetch(`${baseUrl}/api/agent/planning`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: task.id, title: task.title, notes: task.notes, category: task.category }),
        })

        results.push({ task: task.title, agent: decision.agent, complexity: 'complex', route: 'planning' })
      } else {
        await db.from('tasks').update({
          agent_status: 'in_progress',
          notes: `[BOSS AGENT — SIMPLE]\nАгент: ${decision.agent}\n${decision.reason}\nОценка: ${decision.estimate}`,
        }).eq('id', task.id)

        const msg = [
          `🧠 <b>Boss Agent</b>`,
          ``,
          `📌 <b>${task.title}</b>`,
          `${agentEmoji[decision.agent]} → <b>${decision.agent} agent</b> (простая задача)`,
          `⏱ ${decision.estimate}`,
          ``,
          `${decision.reason}`,
        ].join('\n')

        await sendTelegram(msg)
        results.push({ task: task.title, agent: decision.agent, complexity: 'simple', route: 'direct' })
      }
    } catch (err) {
      await db.from('tasks').update({ agent_status: 'pending' }).eq('id', task.id)
      results.push({ task: task.title, ok: false, error: String(err) })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
