// Seed script: заполняет таблицы projects и orders начальными данными
// Запуск: node scripts/seed-projects-orders.mjs

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Загружаем .env.local
try {
  const envPath = join(__dirname, '..', '.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
  console.log('✅ .env.local загружен')
} catch {
  console.log('⚠️  .env.local не найден, используем переменные окружения')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const projects = [
  {
    title: 'Ailnex',
    description: 'Automation agency — помогаем бизнесу автоматизировать процессы через AI и n8n.',
    stage: 'building',
    url: 'https://ailnex.com',
    next_step: 'Снять видео, подключить GA4, запустить первые лиды',
    tags: ['agency', 'automation', 'AI'],
    archived: false,
  },
  {
    title: 'InvoicePilot',
    description: 'AI генерирует 3 письма-напоминания для неоплаченных инвойсов. Для фрилансеров. $39/мес.',
    stage: 'building',
    url: 'https://invoicepilot.app',
    next_step: 'Запустить маркетинг, первые платящие клиенты',
    tags: ['SaaS', 'invoices', 'freelancers'],
    archived: false,
  },
  {
    title: 'ReviewAgent',
    description: 'AI генерирует ответы на отзывы Google/Yelp. Для ресторанов, салонов, стоматологий. $49/мес.',
    stage: 'building',
    url: null,
    next_step: 'Доделать MVP, записать демо, найти первых клиентов',
    tags: ['SaaS', 'reviews', 'local business'],
    archived: false,
  },
  {
    title: 'AI Reception — Telegram бот записи',
    description: 'AI-ресепшн для чешских beauty-салонов. Принимает звонки, записывает клиентов. Лендинг live.',
    stage: 'launched',
    url: 'https://reception-ai.cz',
    next_step: 'Найти первых клиентов в Праге',
    tags: ['AI', 'beauty', 'Czech market'],
    archived: false,
  },
  {
    title: 'CzechPass',
    description: 'AI подготовка к экзамену на ПМЖ (A2 чешский) для русскоязычных в ЧР.',
    stage: 'idea',
    url: null,
    next_step: 'Phase 0: домен + GitHub + Supabase + Telegram бот',
    tags: ['EdTech', 'Czech', 'language learning'],
    archived: true,
  },
  {
    title: 'ContractAgent',
    description: 'AI анализ контрактов для B2B. Длинный цикл продаж, CFO трудно достичь.',
    stage: 'idea',
    url: null,
    next_step: null,
    tags: ['SaaS', 'B2B', 'contracts'],
    archived: true,
  },
]

async function seed() {
  console.log('\n🌱 Начинаем сид...\n')

  // Seed projects
  console.log('📁 Вставляем проекты...')
  const { data: insertedProjects, error: projError } = await supabase
    .from('projects')
    .insert(projects)
    .select()

  if (projError) {
    console.error('❌ Ошибка проектов:', projError.message)
    process.exit(1)
  }
  console.log(`✅ Вставлено ${insertedProjects.length} проектов`)

  // Найдём Ailnex для связи с заказом
  const ailnex = insertedProjects.find(p => p.title === 'Ailnex')

  // Seed orders
  console.log('\n📋 Вставляем заказы...')
  const { data: insertedOrders, error: ordError } = await supabase
    .from('orders')
    .insert([
      {
        client: 'Чешский клиент',
        title: 'Access → Web портал',
        description: 'Перенос базы данных Access в веб-приложение. Бюджет 50–100k CZK.',
        status: 'discussion',
        source: 'Referral',
        budget: '50–100k CZK',
        notes: 'Звонок 26 марта. Уточнить требования, текущий стек, сроки.',
        project_id: ailnex?.id || null,
      },
    ])
    .select()

  if (ordError) {
    console.error('❌ Ошибка заказов:', ordError.message)
    process.exit(1)
  }
  console.log(`✅ Вставлено ${insertedOrders.length} заказов`)

  console.log('\n🎉 Сид завершён!')
  console.log('Теперь можно удалить defaultTasks из lib/tasks.ts и orders из lib/orders.ts')
}

seed().catch(err => {
  console.error('❌ Ошибка:', err.message)
  process.exit(1)
})
