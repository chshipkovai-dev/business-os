/**
 * Daily Scout Agent — полностью автономный
 * Запуск: node scripts/run-daily-scout.mjs
 *
 * Источники:
 * 1. Hacker News — топ+лучшие посты (150 уникальных)
 * 2. Reddit — 10 суббреддитов с болями и автоматизацией
 * 3. Product Hunt — топ продукты (нужен PRODUCT_HUNT_TOKEN в .env)
 * 4. GitHub — trending repos + "help wanted" issues
 * 5. Stack Overflow — вопросы об автоматизации без хороших ответов
 *
 * Процесс:
 * 1. Собирает сигналы из всех источников (~500+ постов)
 * 2. Claude Haiku анализирует топ-80 по релевантности
 * 3. Сохраняет ТОЛЬКО горящие боли (score ≥ 6) в Supabase
 * 4. Отправляет отчёт в Telegram
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Загружаем .env.local вручную
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
try {
  const env = readFileSync(envPath, 'utf8')
  for (const line of env.split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length && !key.startsWith('#')) {
      process.env[key.trim()] = rest.join('=').trim()
    }
  }
} catch { /* .env не найден */ }

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

// ─── КЛИЕНТЫ ──────────────────────────────────────────────────────────────────

const ai = new Anthropic({ apiKey: ANTHROPIC_KEY })
const db = createClient(SUPABASE_URL, SERVICE_KEY)

// ─── 1. HACKER NEWS SCOUT ─────────────────────────────────────────────────────

async function fetchHNIdeas() {
  console.log('📡 Сканирую Hacker News...')

  const [topRes, bestRes] = await Promise.all([
    fetch('https://hacker-news.firebaseio.com/v0/topstories.json'),
    fetch('https://hacker-news.firebaseio.com/v0/beststories.json'),
  ])
  const topIds = (await topRes.json()).slice(0, 100)
  const bestIds = (await bestRes.json()).slice(0, 100)
  const ids = [...new Set([...topIds, ...bestIds])].slice(0, 150)

  const signals = []

  for (let i = 0; i < ids.length; i += 5) {
    const batch = ids.slice(i, i + 5)
    const items = await Promise.all(batch.map(async id => {
      try {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        return await r.json()
      } catch { return null }
    }))

    for (const item of items) {
      if (!item?.title) continue
      const t = item.title.toLowerCase()
      if (
        item.title.startsWith('Show HN:') ||
        item.title.startsWith('Ask HN:') ||
        item.title.startsWith('Launch HN:') ||
        t.includes('launched') || t.includes('built') || t.includes('saas') ||
        t.includes('tool') || t.includes('app') || t.includes('automation') ||
        t.includes('startup') || t.includes('api') || t.includes('ai agent') ||
        t.includes('software') || t.includes('product') || t.includes('service')
      ) {
        signals.push({
          title: item.title,
          description: item.text?.slice(0, 500) ?? '',
          sourceUrl: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
          score: item.score ?? 0,
          comments: item.descendants ?? 0,
          source: 'hackernews',
        })
      }
    }

    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`   HN сигналов: ${signals.length}`)
  return signals
}

// ─── 2. REDDIT SCOUT ──────────────────────────────────────────────────────────

const REDDIT_SUBS = [
  // Боли предпринимателей и фрилансеров
  'entrepreneur',    // "трачу 10 часов на X вручную"
  'SaaS',            // "нужен инструмент для Y"
  'smallbusiness',   // боли малого бизнеса
  'freelance',       // проблемы фрилансеров
  'startups',        // идеи и пивоты
  'indiehackers',    // micro-SaaS победители
  // Добавлено: источники горящих болей автоматизации
  'automation',      // "хочу автоматизировать X, как это сделать?"
  'nocode',          // хотят автоматизировать но не умеют кодить → нужен инструмент
  'productivity',    // тратят время на рутину которую можно автоматизировать
  'consulting',      // боли консультантов и агентств
]

// Получаем OAuth токен Reddit (app-only, без логина пользователя)
// Нужны переменные: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
// Создать приложение: https://www.reddit.com/prefs/apps → script → любой redirect URI
async function getRedditToken() {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  try {
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        // Reddit требует: platform:appid:version (by /u/username)
        'User-Agent': 'server:scout-agent:1.0 (by /u/scout_bot_ai)',
      },
      body: 'grant_type=client_credentials',
    })
    if (!res.ok) return null
    const { access_token } = await res.json()
    return access_token
  } catch {
    return null
  }
}

async function fetchRedditIdeas() {
  console.log('📡 Сканирую Reddit...')
  const signals = []

  // Пробуем получить OAuth токен (работает с GitHub Actions, обходит блокировку IP)
  const redditToken = await getRedditToken()
  const baseUrl = redditToken ? 'https://oauth.reddit.com' : 'https://www.reddit.com'
  const headers = redditToken
    ? { 'Authorization': `Bearer ${redditToken}`, 'User-Agent': 'server:scout-agent:1.0 (by /u/scout_bot_ai)' }
    : { 'User-Agent': 'server:scout-agent:1.0 (by /u/scout_bot_ai)' }

  if (!redditToken) {
    console.log('   ⚠️ Reddit OAuth не настроен — используем публичный API (может блокироваться с облака)')
    console.log('   💡 Добавь REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET в GitHub Secrets')
  }

  for (const sub of REDDIT_SUBS) {
    try {
      const [hotRes, newRes] = await Promise.all([
        fetch(`${baseUrl}/r/${sub}/hot.json?limit=25`, { headers }),
        fetch(`${baseUrl}/r/${sub}/new.json?limit=25`, { headers }),
      ])

      // Проверяем что ответ не заблокирован (Reddit возвращает HTML при блокировке)
      const contentType = hotRes.headers.get('content-type') ?? ''
      if (!contentType.includes('json')) {
        console.log(`   ⚠️ Reddit r/${sub} вернул не-JSON (заблокирован облачным IP)`)
        continue
      }

      const hotData = await hotRes.json()
      const newData = await newRes.json()

      const posts = [
        ...(hotData?.data?.children ?? []),
        ...(newData?.data?.children ?? []),
      ]

      for (const { data: post } of posts) {
        if (!post?.title) continue
        const t = post.title.toLowerCase()
        const text = (post.selftext || '').slice(0, 600)

        const hasPain = (
          t.includes('spend') || t.includes('waste') || t.includes('hate') ||
          t.includes('tired') || t.includes('struggling') || t.includes('manually') ||
          t.includes('problem') || t.includes('issue') || t.includes('pain') ||
          t.includes('difficult') || t.includes('hard to') || t.includes('how do') ||
          t.includes('tool') || t.includes('app') || t.includes('software') ||
          t.includes('automate') || t.includes('built') || t.includes('launched') ||
          t.includes('saas') || t.includes('startup') || t.includes('ai') ||
          t.includes('freelan') || t.includes('client') || t.includes('invoice') ||
          t.includes('workflow') || t.includes('productivity') || t.includes('manage') ||
          // Новые горящие сигналы
          t.includes('hours') || t.includes('every week') || t.includes('every day') ||
          t.includes('wish there was') || t.includes('why is there no') ||
          t.includes('looking for') || t.includes('does anyone know') ||
          t.includes('i need') || t.includes('anyone else') || t.includes('frustrated')
        )

        if (hasPain) {
          signals.push({
            title: post.title,
            description: text,
            sourceUrl: `https://reddit.com${post.permalink}`,
            score: post.score ?? 0,
            comments: post.num_comments ?? 0,
            source: `reddit_${sub}`,
          })
        }
      }

      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.log(`   ⚠️ Reddit r/${sub} недоступен: ${err.message}`)
    }
  }

  console.log(`   Reddit сигналов: ${signals.length}`)
  return signals
}

// ─── 3. PRODUCT HUNT SCOUT ────────────────────────────────────────────────────

async function getProductHuntToken() {
  const clientId = process.env.PRODUCT_HUNT_CLIENT_ID
  const clientSecret = process.env.PRODUCT_HUNT_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const res = await fetch('https://api.producthunt.com/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

async function fetchProductHuntIdeas() {
  console.log('📡 Сканирую Product Hunt...')
  const signals = []

  try {
    const token = await getProductHuntToken()
    if (!token) {
      console.log('   Product Hunt: нет PRODUCT_HUNT_CLIENT_ID/SECRET в .env — пропускаю')
      return signals
    }

    const query = `{
      posts(first: 30, order: VOTES) {
        edges {
          node {
            name
            tagline
            description
            votesCount
            commentsCount
            url
            topics { edges { node { name } } }
          }
        }
      }
    }`

    const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    })

    if (res.ok) {
      const data = await res.json()
      const posts = data?.data?.posts?.edges ?? []

      for (const { node: post } of posts) {
        signals.push({
          title: `${post.name}: ${post.tagline}`,
          description: post.description?.slice(0, 500) ?? post.tagline,
          sourceUrl: post.url,
          score: post.votesCount ?? 0,
          comments: post.commentsCount ?? 0,
          source: 'producthunt',
        })
      }
      console.log(`   Product Hunt сигналов: ${signals.length}`)
    } else {
      console.log('   Product Hunt: ошибка API')
    }
  } catch (err) {
    console.log(`   Product Hunt: недоступен (${err.message})`)
  }

  return signals
}

// ─── 4. GITHUB SCOUT ──────────────────────────────────────────────────────────

async function fetchGitHubIdeas() {
  console.log('📡 Сканирую GitHub...')
  const signals = []
  const headers = { 'User-Agent': 'ScoutBot/1.0', 'Accept': 'application/vnd.github.v3+json' }

  try {
    // Trending repos созданные в последние 30 дней — что люди строят прямо сейчас
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const trendingRes = await fetch(
      `https://api.github.com/search/repositories?q=topic:saas+created:>${thirtyDaysAgo}&sort=stars&per_page=20`,
      { headers }
    )
    if (trendingRes.ok) {
      const trendingData = await trendingRes.json()
      for (const repo of trendingData.items ?? []) {
        if (!repo.description) continue
        signals.push({
          title: `[GitHub Trending] ${repo.name}: ${repo.description}`,
          description: `Stars: ${repo.stargazers_count}. Topics: ${(repo.topics || []).join(', ')}`,
          sourceUrl: repo.html_url,
          score: repo.stargazers_count,
          comments: repo.open_issues_count ?? 0,
          source: 'github_trending',
        })
      }
    }

    await new Promise(r => setTimeout(r, 500))

    // "Help wanted" + "enhancement" issues в популярных SaaS/automation репо
    // Это реальные запросы: разработчики говорят "нам нужна эта фича, некому сделать"
    const issuesRes = await fetch(
      `https://api.github.com/search/issues?q=label:"help+wanted"+label:"enhancement"+is:open+is:issue+topic:saas+OR+topic:automation&sort=reactions&per_page=20`,
      { headers }
    )
    if (issuesRes.ok) {
      const issuesData = await issuesRes.json()
      for (const issue of issuesData.items ?? []) {
        signals.push({
          title: `[GitHub Issue] ${issue.title}`,
          description: issue.body?.slice(0, 500) ?? '',
          sourceUrl: issue.html_url,
          score: issue.reactions?.['+1'] ?? 0,
          comments: issue.comments ?? 0,
          source: 'github_issues',
        })
      }
    }

    console.log(`   GitHub сигналов: ${signals.length}`)
  } catch (err) {
    console.log(`   ⚠️ GitHub недоступен: ${err.message}`)
  }

  return signals
}

// ─── 5. STACK OVERFLOW SCOUT ──────────────────────────────────────────────────

async function fetchStackOverflowIdeas() {
  console.log('📡 Сканирую Stack Overflow...')
  const signals = []

  // Теги где люди ищут автоматизацию — "как автоматизировать X?" = потенциальный продукт
  const tags = ['automation', 'workflow-automation', 'business-process', 'web-scraping']

  try {
    for (const tag of tags) {
      const res = await fetch(
        `https://api.stackexchange.com/2.3/questions?order=desc&sort=creation&site=stackoverflow&tagged=${tag}&pagesize=15&filter=default`,
        { headers: { 'User-Agent': 'ScoutBot/1.0' } }
      )

      if (!res.ok) continue
      const data = await res.json()

      for (const q of data.items ?? []) {
        // Берём только вопросы без принятого ответа — незакрытая потребность
        if (q.is_answered) continue

        signals.push({
          title: `[Stack Overflow] ${q.title}`,
          description: `Просмотры: ${q.view_count}, Голоса: ${q.score}. Теги: ${q.tags.join(', ')}`,
          sourceUrl: q.link,
          score: q.score,
          comments: q.answer_count ?? 0,
          source: 'stackoverflow',
        })
      }

      await new Promise(r => setTimeout(r, 300))
    }

    console.log(`   Stack Overflow сигналов: ${signals.length}`)
  } catch (err) {
    console.log(`   ⚠️ Stack Overflow недоступен: ${err.message}`)
  }

  return signals
}

// ─── 6. CLAUDE АНАЛИЗАТОР ─────────────────────────────────────────────────────

async function analyzeSignal(signal) {
  const sourceLabel =
    signal.source.startsWith('reddit') ? 'Reddit' :
    signal.source === 'producthunt' ? 'Product Hunt' :
    signal.source.startsWith('github') ? 'GitHub' :
    signal.source === 'stackoverflow' ? 'Stack Overflow' : 'Hacker News'

  const prompt = `Ты эксперт-аналитик стартапов. Проанализируй этот сигнал из ${sourceLabel} и определи — является ли это ГОРЯЩЕЙ бизнес-возможностью прямо сейчас.

Заголовок: ${signal.title}
Описание: ${signal.description || 'Нет описания'}
Источник: ${signal.source}
Голоса: ${signal.score}, Комментарии: ${signal.comments}

ВАЖНО: нам нужны только ГОРЯЩИЕ боли — проблемы где люди ПРЯМО СЕЙЧАС теряют деньги или время.
НЕ нужны: "было бы неплохо иметь", теоретические идеи, ниши с неясным WTP.

ВАЖНО: весь текст в JSON должен быть на РУССКОМ языке.
Ответь ТОЛЬКО валидным JSON (без markdown):
{
  "isOpportunity": true/false,
  "urgency": 1-10,
  "title": "Чёткое название продукта на русском",
  "description": "1-2 предложения что делает продукт — на русском",
  "problem": "Какую конкретную проблему решает — на русском",
  "targetAudience": "Кто платит за это (конкретно) — на русском",
  "marketScore": 1-10,
  "competitionScore": 1-10,
  "monetizationScore": 1-10,
  "buildDifficulty": 1-10,
  "reasoning": "Почему такие оценки — на русском",
  "tags": ["тег1", "тег2"]
}

urgency = насколько ГОРИТ: 10 = люди теряют деньги прямо сейчас, 1 = "было бы неплохо".
isOpportunity=true ТОЛЬКО если:
- Реальная B2B проблема которую люди УЖЕ пытаются решить (вручную, дорогими инструментами)
- Клиент платёжеспособен и явно готов платить
- Можно построить за <3 месяца
- urgency ≥ 6`

  try {
    const response = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].text
    const text = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(text)
    if (!parsed.isOpportunity) return null

    const totalScore = Number(((
      parsed.marketScore + parsed.competitionScore +
      parsed.monetizationScore + (10 - parsed.buildDifficulty)
    ) / 4).toFixed(1))

    // Только горячие идеи — порог 7.0
    if (totalScore < 7.0) return null

    return {
      title: parsed.title,
      description: parsed.description,
      problem: parsed.problem,
      target_audience: parsed.targetAudience,
      source: signal.source,
      source_url: signal.sourceUrl,
      market_score: parsed.marketScore,
      competition_score: parsed.competitionScore,
      monetization_score: parsed.monetizationScore,
      build_difficulty: parsed.buildDifficulty,
      total_score: totalScore,
      reasoning: parsed.reasoning,
      tags: parsed.tags ?? [],
      status: 'new',
    }
  } catch {
    return null
  }
}

// ─── 7. СОХРАНЕНИЕ В SUPABASE (с умной дедупликацией) ────────────────────────

// Извлекаем ключевые слова из заголовка для сравнения
function extractKeywords(title) {
  return title.toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
}

// Считаем процент совпадающих слов между двумя заголовками
function similarity(title1, title2) {
  const w1 = new Set(extractKeywords(title1))
  const w2 = new Set(extractKeywords(title2))
  const intersection = [...w1].filter(w => w2.has(w)).length
  const union = new Set([...w1, ...w2]).size
  return union === 0 ? 0 : intersection / union
}

async function saveToDatabase(ideas) {
  // Загружаем заголовки всех существующих идей из базы
  const { data: existing } = await db.from('ideas').select('title')
  const existingTitles = (existing ?? []).map(r => r.title)

  let saved = 0
  let skipped = 0

  for (const idea of ideas) {
    // Проверяем похожесть с существующими идеями (порог 40%)
    const isDuplicate = existingTitles.some(t => similarity(t, idea.title) > 0.4)
    if (isDuplicate) {
      skipped++
      continue
    }

    const { error } = await db.from('ideas').upsert(idea, { onConflict: 'title' })
    if (!error) {
      saved++
      existingTitles.push(idea.title) // добавляем чтобы не дублировать внутри одного прогона
    }
  }

  if (skipped > 0) console.log(`   Дубликатов отфильтровано: ${skipped}`)
  return saved
}

// ─── 8. TELEGRAM УВЕДОМЛЕНИЕ ──────────────────────────────────────────────────

async function sendTelegram(message) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' }),
    })
  } catch { /* telegram недоступен */ }
}

// ─── ГЛАВНАЯ ФУНКЦИЯ ──────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now()
  console.log('\n🤖 Daily Scout запущен:', new Date().toLocaleString('ru'))
  console.log('─'.repeat(50))

  // Шаг 1: Собираем сигналы из всех источников параллельно
  const [hnSignals, redditSignals, phSignals, githubSignals, soSignals] = await Promise.all([
    fetchHNIdeas(),
    fetchRedditIdeas(),
    fetchProductHuntIdeas(),
    fetchGitHubIdeas(),
    fetchStackOverflowIdeas(),
  ])

  const allSignals = [...hnSignals, ...redditSignals, ...phSignals, ...githubSignals, ...soSignals]
  console.log(`\n📊 Всего сигналов: ${allSignals.length}`)
  console.log(`   HN: ${hnSignals.length} | Reddit: ${redditSignals.length} | PH: ${phSignals.length} | GitHub: ${githubSignals.length} | SO: ${soSignals.length}`)

  if (allSignals.length === 0) {
    console.log('⚠️  Сигналов не найдено')
    return
  }

  // Шаг 2: Анализируем топ-80 по вовлечённости (голоса + комментарии)
  const topSignals = allSignals
    .sort((a, b) => (b.score + b.comments * 2) - (a.score + a.comments * 2))
    .slice(0, 80)

  console.log(`\n🧠 Анализирую топ ${topSignals.length} сигналов через Claude...`)

  const ideas = []
  for (let i = 0; i < topSignals.length; i++) {
    const signal = topSignals[i]
    const srcIcon =
      signal.source.startsWith('reddit') ? '🔴' :
      signal.source === 'producthunt' ? '🟠' :
      signal.source.startsWith('github') ? '🟣' :
      signal.source === 'stackoverflow' ? '🔵' : '🟡'

    process.stdout.write(`   [${i + 1}/${topSignals.length}] ${srcIcon} ${signal.title.slice(0, 45)}...`)
    const idea = await analyzeSignal(signal)
    if (idea) {
      ideas.push(idea)
      process.stdout.write(` ✅ ${idea.total_score}/10\n`)
    } else {
      process.stdout.write(` ⬜\n`)
    }
    await new Promise(r => setTimeout(r, 300))
  }

  // Шаг 3: Сохраняем в базу
  console.log(`\n💾 Сохраняю ${ideas.length} горящих идей в базу данных...`)
  const saved = await saveToDatabase(ideas)
  console.log(`   Сохранено: ${saved} (дубликаты пропущены)`)

  // Шаг 4: Telegram отчёт
  const duration = Math.round((Date.now() - startTime) / 1000)
  const sortedIdeas = ideas.sort((a, b) => b.total_score - a.total_score)

  const hnFound = ideas.filter(i => i.source === 'hackernews').length
  const redditFound = ideas.filter(i => i.source.startsWith('reddit')).length
  const phFound = ideas.filter(i => i.source === 'producthunt').length
  const ghFound = ideas.filter(i => i.source.startsWith('github')).length
  const soFound = ideas.filter(i => i.source === 'stackoverflow').length

  const report = [
    `🤖 ${new Date().toLocaleDateString('ru-RU')} — скаут отработал`,
    `💡 Новых горячих идей: <b>${saved}</b>`,
    ``,
    `🟡 HN: ${hnSignals.length} → ${hnFound}`,
    `🔴 Reddit: ${redditSignals.length} → ${redditFound}`,
    `🟠 Product Hunt: ${phSignals.length} → ${phFound}`,
    `🟣 GitHub: ${githubSignals.length} → ${ghFound}`,
    `🔵 Stack Overflow: ${soSignals.length} → ${soFound}`,
  ].join('\n')

  if (TELEGRAM_TOKEN) {
    await sendTelegram(report)
    console.log('\n📱 Telegram уведомление отправлено')
  }

  console.log('\n─'.repeat(50))
  console.log(`✅ Готово! Найдено ${ideas.length} горящих идей, сохранено ${saved}`)
  console.log(`Открой дашборд: http://localhost:3000/ideas\n`)
}

main().catch(err => {
  console.error('❌ Ошибка:', err.message)
  process.exit(1)
})
