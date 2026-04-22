/**
 * archive-bad-ideas.mjs
 * Помечает нерелевантные идеи как archived в Supabase.
 * Они пропадут с сайта но останутся в базе (история).
 *
 * Запуск: node scripts/archive-bad-ideas.mjs
 *
 * Критерии для архивации:
 * - Мета-идеи (не продукты, а советы/стратегии)
 * - Корпоративные ниши (>500 сотрудников)
 * - Нужна лицензия (HIPAA, финансы, юридика)
 * - Нет реального денежного ущерба
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── Ключевые слова для автоматической архивации ──────────────────────────────

// Паттерны в заголовке → однозначно архивировать
const ARCHIVE_PATTERNS = [
  // Мета-идеи и советы (не продукты)
  /нишевых b2b проблем/i,
  /вместо очередного/i,
  /как найти идею/i,
  /стратегия поиска/i,
  /подход к поиску/i,

  // Корпоративные / enterprise ниши
  /enterprise/i,
  /корпоративн/i,

  // Регуляторные ниши
  /hipaa/i,
  /медицинск/i,
  /юридическ/i,
  /compliance/i,
  /gdpr/i,
]

// Конкретные заголовки которые точно архивируем
const ARCHIVE_TITLES = [
  'Поиск нишевых B2B проблем вместо очередного AI приложения',
]

// ─── Главная функция ──────────────────────────────────────────────────────────

async function main() {
  console.log('\n🗄️  Архивация нерелевантных идей...\n')

  // Загружаем все идеи со статусом не archived
  const { data: ideas, error } = await db
    .from('ideas')
    .select('id, title, status, total_score')
    .neq('status', 'archived')

  if (error) {
    console.error('❌ Ошибка загрузки:', error.message)
    process.exit(1)
  }

  console.log(`📊 Всего активных идей: ${ideas.length}`)

  const toArchive = []

  for (const idea of ideas) {
    const matchesPattern = ARCHIVE_PATTERNS.some(p => p.test(idea.title))
    const matchesTitle = ARCHIVE_TITLES.some(t =>
      idea.title.toLowerCase().includes(t.toLowerCase())
    )

    if (matchesPattern || matchesTitle) {
      toArchive.push(idea)
    }
  }

  if (toArchive.length === 0) {
    console.log('✅ Нечего архивировать — все идеи релевантны')
    return
  }

  console.log(`\n📦 Архивирую ${toArchive.length} нерелевантных идей:`)
  for (const idea of toArchive) {
    console.log(`   ❌ [${idea.total_score}] ${idea.title}`)
  }

  // Обновляем статус
  const ids = toArchive.map(i => i.id)
  const { error: updateError } = await db
    .from('ideas')
    .update({ status: 'archived' })
    .in('id', ids)

  if (updateError) {
    console.error('❌ Ошибка архивации:', updateError.message)
    process.exit(1)
  }

  console.log(`\n✅ Архивировано: ${toArchive.length} идей`)
  console.log('   Они исчезнут с сайта но останутся в базе.')
  console.log('   Для восстановления: UPDATE ideas SET status=\'new\' WHERE id=...')
}

main().catch(err => {
  console.error('❌ Ошибка:', err.message)
  process.exit(1)
})
