import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

function getRepoAndType(notes: string): { repo: string, projectType: string } {
  const repoMatch = notes.match(/GITHUB_REPO:\s*([^\n]+)/)
  const repo = repoMatch ? repoMatch[1].trim() : ''
  const typeMatch = notes.match(/PROJECT_TYPE:\s*([^\n]+)/)
  const projectType = typeMatch ? typeMatch[1].trim() : 'web'
  return { repo, projectType }
}

async function getLatestDeployment(projectName: string): Promise<{
  state: string
  url: string | null
  deployId: string | null
  errorMessage: string | null
}> {
  const token = process.env.VERCEL_TOKEN
  if (!token) return { state: 'unknown', url: null, deployId: null, errorMessage: 'VERCEL_TOKEN not set' }

  const res = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${projectName}&limit=1`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )

  if (!res.ok) {
    // Try by name if projectId lookup fails
    const res2 = await fetch(
      `https://api.vercel.com/v6/deployments?app=${projectName}&limit=1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    if (!res2.ok) return { state: 'unknown', url: null, deployId: null, errorMessage: `Vercel API ${res.status}` }
    const data2 = await res2.json()
    const d = data2.deployments?.[0]
    if (!d) return { state: 'unknown', url: null, deployId: null, errorMessage: 'No deployments found' }
    return {
      state: d.state ?? d.readyState ?? 'unknown',
      url: d.url ? `https://${d.url}` : null,
      deployId: d.uid ?? null,
      errorMessage: d.errorMessage ?? null,
    }
  }

  const data = await res.json()
  const d = data.deployments?.[0]
  if (!d) return { state: 'unknown', url: null, deployId: null, errorMessage: 'No deployments found' }

  return {
    state: d.state ?? d.readyState ?? 'unknown',
    url: d.url ? `https://${d.url}` : null,
    deployId: d.uid ?? null,
    errorMessage: d.errorMessage ?? null,
  }
}

async function getDeploymentBuildLogs(deployId: string): Promise<string> {
  const token = process.env.VERCEL_TOKEN
  if (!token) return ''
  const res = await fetch(
    `https://api.vercel.com/v2/deployments/${deployId}/events`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  if (!res.ok) return ''
  const events = await res.json() as Array<{ type: string; payload?: { text?: string } }>
  return events
    .filter(e => e.type === 'stderr' || e.type === 'stdout')
    .map(e => e.payload?.text ?? '')
    .join('\n')
    .slice(-2000)
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

  const { repo, projectType } = getRepoAndType(task.notes || '')
  const projectName = repo.split('/').pop() ?? repo

  await db.from('tasks').update({ agent_status: 'deploying' }).eq('id', task_id)

  await sendTelegram([
    `🚀 <b>Deployment Monitor запущен</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `📦 Проект: <code>${projectName}</code>`,
    `⏳ Жду деплоя (до 5 минут)...`,
  ].join('\n'))

  const MAX_ITERATIONS = 10
  const POLL_INTERVAL_MS = 30_000

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (i > 0) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    }

    const deployment = await getLatestDeployment(projectName)
    const state = deployment.state.toUpperCase()

    if (state === 'READY') {
      const deployUrl = deployment.url ?? `https://${projectName}.vercel.app`

      await db.from('tasks').update({
        notes: `${task.notes}\n\n[DEPLOYMENT MONITOR]\nStatus: ready\nURL: ${deployUrl}\nDeploy ID: ${deployment.deployId ?? 'unknown'}`,
      }).eq('id', task_id)

      await sendTelegram([
        `✅ <b>Деплой успешен!</b>`,
        ``,
        `📌 <b>${task.title}</b>`,
        ``,
        `🌐 <a href="${deployUrl}">${deployUrl}</a>`,
        ``,
        projectType === 'web' ? `🔍 Запускаю QA проверку...` : `🎉 Готово!`,
      ].join('\n'))

      if (projectType === 'web') {
        await fetch(`${baseUrl}/api/agent/qa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id }),
        }).catch(() => {})
      } else {
        await db.from('tasks').update({ agent_status: 'done' }).eq('id', task_id)
      }

      return NextResponse.json({ ok: true, state: 'ready', url: deployUrl })
    }

    if (state === 'ERROR' || state === 'FAILED' || state === 'CANCELED') {
      const logs = deployment.deployId ? await getDeploymentBuildLogs(deployment.deployId) : ''
      const errorSnippet = (deployment.errorMessage ?? logs).slice(0, 500)

      await db.from('tasks').update({
        agent_status: 'approved',
        notes: `${task.notes}\n\n[DEPLOYMENT MONITOR]\nStatus: error\nError: ${errorSnippet}`,
      }).eq('id', task_id)

      await sendTelegram([
        `❌ <b>Деплой упал!</b>`,
        ``,
        `📌 <b>${task.title}</b>`,
        ``,
        `<b>Ошибка:</b>`,
        `<code>${errorSnippet.slice(0, 300)}</code>`,
        ``,
        `🔄 Передаю Builder на фикс...`,
      ].join('\n'))

      await fetch(`${baseUrl}/api/agent/builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id }),
      }).catch(() => {})

      return NextResponse.json({ ok: false, state, error: errorSnippet })
    }

    // BUILDING, QUEUED, INITIALIZING — продолжаем ждать
    await sendTelegram(`⏳ Деплой <b>${projectName}</b>: ${state.toLowerCase()} (${i + 1}/${MAX_ITERATIONS})`)
  }

  // Timeout
  const vercelUrl = `https://vercel.com/chshipkovai-dev/${projectName}`
  await db.from('tasks').update({ agent_status: 'done' }).eq('id', task_id)

  await sendTelegram([
    `⚠️ <b>Deployment Monitor: timeout</b>`,
    ``,
    `📌 <b>${task.title}</b>`,
    `Деплой не завершился за 5 минут.`,
    ``,
    `🔗 <a href="${vercelUrl}">Проверить в Vercel</a>`,
  ].join('\n'))

  return NextResponse.json({ ok: false, state: 'timeout' })
}
