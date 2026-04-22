import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function sendTelegram(chatId: string, msg: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
  }).catch(() => {})
}

async function answerCallback(callbackId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId }),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.callback_query) {
    const query = body.callback_query
    const data = query.data as string
    const chatId = String(query.message.chat.id)

    await answerCallback(query.id)

    const [action, taskId] = data.split(':')
    if (!taskId) return NextResponse.json({ ok: true })

    const db = getDB()

    if (action === 'approve') {
      await db.from('tasks').update({ agent_status: 'approved' }).eq('id', taskId)

      await sendTelegram(chatId, [
        `✅ <b>Апрув принят</b>`,
        ``,
        `Задача передана Builder Agent.`,
        `Начинаю разработку — пришлю результат когда готово.`,
      ].join('\n'))

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://business-os-alpha-rust.vercel.app'
      await fetch(`${baseUrl}/api/agent/builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      }).catch(() => {})

    } else if (action === 'revise') {
      await db.from('tasks').update({ agent_status: 'pending' }).eq('id', taskId)

      await sendTelegram(chatId, [
        `✏️ <b>Хорошо, жду правки</b>`,
        ``,
        `Напиши что нужно изменить в плане — обновлю и пришлю новую версию.`,
      ].join('\n'))
    }

    return NextResponse.json({ ok: true })
  }

  if (body.message?.text) {
    const text = body.message.text as string
    const chatId = String(body.message.chat.id)

    if (text === '/start') {
      await sendTelegram(chatId, '👋 <b>FORGE Bot активен.</b>\nЖду задачи из дашборда.')
      return NextResponse.json({ ok: true })
    }
  }

  return NextResponse.json({ ok: true })
}
