import { NextResponse } from 'next/server'

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://business-os-alpha-rust.vercel.app'

  if (!token) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 })

  const webhookUrl = `${baseUrl}/api/telegram/webhook`

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  })

  const data = await res.json()
  return NextResponse.json({ webhookUrl, telegram: data })
}

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 })

  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
  const data = await res.json()
  return NextResponse.json(data)
}
