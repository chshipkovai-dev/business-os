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

const BOSS_PROMPT = `Ты — Boss Agent компании ailnex. Получаешь задачу от владельца и составляешь чёткий план выполнения.

Задача: {TITLE}
Заметки: {NOTES}
Категория: {CATEGORY}
Приоритет: {PRIORITY}

Определи тип агента который должен выполнить задачу:
- "builder" — если нужно написать код, создать автоматизацию, построить агента, настроить интеграцию
- "designer" — если нужно сделать UI, лендинг, компонент, дизайн, визуал
- "marketing" — если нужно написать контент, пост, email, SEO, аутрич

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "agent": "builder" | "designer" | "marketing",
  "analysis": "2-3 предложения — что именно нужно сделать и почему этот агент",
  "plan": [
    "Шаг 1: конкретное действие",
    "Шаг 2: конкретное действие",
    "Шаг 3: конкретное действие"
  ],
  "estimate": "реалистичная оценка времени. Пример: 2-3 часа",
  "first_action": "самое первое конкретное действие прямо сейчас"
}`

export async function POST() {
  const db = getDB()

  // Берём все pending задачи
  const { data: tasks, error } = await db
    .from('tasks')
    .select('*')
    .eq('agent_status', 'pending')
    .eq('done', false)
    .order('created_at', { ascending: true })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ ok: true, message: 'Нет новых задач' })
  }

  const results = []

  for (const task of tasks) {
    // Помечаем как взятую в работу
    await db
      .from('tasks')
      .update({ agent_status: 'picked_up' })
      .eq('id', task.id)

    const prompt = BOSS_PROMPT
      .replace('{TITLE}', task.title)
      .replace('{NOTES}', task.notes || 'нет')
      .replace('{CATEGORY}', task.category)
      .replace('{PRIORITY}', task.priority)

    try {
      const response = await ai.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      const text = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const plan = JSON.parse(text)

      // Сохраняем план в заметки задачи
      await db
        .from('tasks')
        .update({
          agent_status: 'in_progress',
          notes: `[BOSS AGENT]\nАгент: ${plan.agent}\n\n${plan.analysis}\n\nПлан:\n${plan.plan.join('\n')}\n\nОценка: ${plan.estimate}\n\nПервый шаг: ${plan.first_action}`,
        })
        .eq('id', task.id)

      const agentEmoji: Record<string, string> = {
        builder: '⚙️',
        designer: '🎨',
        marketing: '📣',
      }

      const msg = [
        `🧠 <b>Boss Agent — новая задача</b>`,
        ``,
        `📌 <b>${task.title}</b>`,
        ``,
        `${agentEmoji[plan.agent] || '🤖'} Передаю: <b>${plan.agent} agent</b>`,
        `⏱ Оценка: <b>${plan.estimate}</b>`,
        ``,
        `📋 ${plan.analysis}`,
        ``,
        `<b>План:</b>`,
        ...plan.plan.map((s: string) => `• ${s}`),
        ``,
        `🚀 Первый шаг: ${plan.first_action}`,
      ].join('\n')

      await sendTelegram(msg)
      results.push({ task: task.title, agent: plan.agent, ok: true })

    } catch (err) {
      await db
        .from('tasks')
        .update({ agent_status: 'pending' })
        .eq('id', task.id)

      results.push({ task: task.title, ok: false, error: String(err) })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
