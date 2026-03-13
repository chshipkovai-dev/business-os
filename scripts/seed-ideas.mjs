/**
 * Seed script — заполняет Supabase базу данных идеями из lib/data.ts
 * Запуск: node scripts/seed-ideas.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bedmnmvsftbudsgcymyw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZG1ubXZzZnRidWRzZ2N5bXl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0NjQ5MiwiZXhwIjoyMDg4ODIyNDkyfQ.LUNjgM7h--NQQVVSfIbUPfDdlrGazj-C8X08DG55dtA'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const ideas = [
  { title: "Amazon Listing Optimizer AI", description: "AI анализирует листинг Amazon и переписывает title, bullets, description для максимального CTR.", problem: "Плохие листинги = низкий CTR и продажи", target_audience: "Amazon FBA sellers (9.7M)", source: "research", source_url: "", market_score: 9, competition_score: 7, monetization_score: 9, build_difficulty: 7, total_score: 8.2, reasoning: "Огромный рынок, конкуренты есть но нет чистого AI решения", tags: ["AI","E-commerce","SaaS"], status: "new" },
  { title: "Content Repurposing AI", description: "Загружаешь YouTube/podcast — получаешь Twitter threads, LinkedIn посты, newsletter автоматически.", problem: "Создатели тратят часы на перепаковку контента", target_audience: "Content creators, маркетологи", source: "research", source_url: "", market_score: 9, competition_score: 6, monetization_score: 9, build_difficulty: 8, total_score: 8.0, reasoning: "Рынок creator tools $1B → $3.5B к 2027", tags: ["AI","Content","Creator"], status: "new" },
  { title: "Shopify Abandoned Cart AI", description: "AI пишет персонализированные email/SMS follow-up для брошенных корзин.", problem: "70% корзин бросают, магазины теряют миллионы", target_audience: "Shopify merchants (4.6M)", source: "research", source_url: "", market_score: 9, competition_score: 7, monetization_score: 9, build_difficulty: 7, total_score: 8.0, reasoning: "Готовые к оплате клиенты, высокая конверсия", tags: ["AI","E-commerce","Email"], status: "new" },
  { title: "Grant Tracker for Nonprofits", description: "Отслеживает доступные гранты, дедлайны, статус заявок для некоммерческих организаций.", problem: "Некоммерческие организации пропускают дедлайны грантов", target_audience: "Nonprofits (1.5M в США)", source: "research", source_url: "", market_score: 7, competition_score: 8, monetization_score: 7, build_difficulty: 8, total_score: 7.8, reasoning: "Нишевая боль, мало конкурентов, готовы платить", tags: ["SaaS","Nonprofit"], status: "new" },
  { title: "ContractAgent", description: "AI агент который автономно управляет корпоративными контрактами для SMB: извлечение из email, трекинг renewals, алерты.", problem: "56% компаний пропускают renewals, 9% выручки теряется", target_audience: "SMB компании 10-200 сотрудников", source: "research", source_url: "", market_score: 7, competition_score: 8, monetization_score: 8, build_difficulty: 7, total_score: 7.9, reasoning: "SMB gap реален, конкуренты дорогие или слабые", tags: ["AI Agent","Legal","SaaS","SMB"], status: "active" },
  { title: "Review Response Automation", description: "AI автоматически отвечает на Google/Yelp/TripAdvisor отзывы в стиле бизнеса.", problem: "Бизнесы теряют репутацию из-за игнорирования отзывов", target_audience: "Рестораны, отели, салоны", source: "research", source_url: "", market_score: 8, competition_score: 6, monetization_score: 8, build_difficulty: 9, total_score: 7.6, reasoning: "Быстрый build, массовый рынок", tags: ["AI","Reviews","Local"], status: "new" },
  { title: "AI Cold Email Personalizer", description: "Загружаешь список компаний → AI исследует каждую и пишет персонализированный первый абзац.", problem: "Холодные письма без персонализации игнорируются", target_audience: "SDR, агентства, B2B founders", source: "research", source_url: "", market_score: 8, competition_score: 6, monetization_score: 8, build_difficulty: 7, total_score: 7.6, reasoning: "Огромный рынок B2B продаж, измеримый ROI", tags: ["AI","Sales","B2B"], status: "new" },
  { title: "FreelancePaymentAgent", description: "AI агент пишет follow-up письма когда клиент не платит вовремя. Дружелюбное → настойчивое → формальное.", problem: "Фрилансеры теряют $10k/год на неоплаченных инвойсах", target_audience: "Фрилансеры (дизайнеры, разработчики, консультанты)", source: "research", source_url: "", market_score: 7, competition_score: 7, monetization_score: 8, build_difficulty: 8, total_score: 7.6, reasoning: "Очень конкретная боль, нет AI решений", tags: ["AI Agent","Finance","Freelance"], status: "building" },
  { title: "OutreachAgent", description: "AI агент для B2B продаж. Говоришь «найди 100 ICP и начни разговор» → агент исследует компании, пишет письма, ведёт диалог.", problem: "B2B продажи требуют часы на ресёрч каждого лида", target_audience: "SDR, агентства, B2B founders", source: "research", source_url: "", market_score: 8, competition_score: 6, monetization_score: 8, build_difficulty: 6, total_score: 7.6, reasoning: "Outcome-based pricing ($50/qualified lead) = очень высокий LTV", tags: ["AI Agent","Sales","B2B"], status: "new" },
  { title: "MeetingNotesAgent for Lawyers", description: "AI создаёт структурированные заметки из юридических встреч в правильном формате.", problem: "Юристы тратят 30% времени на административную работу", target_audience: "Юридические фирмы, независимые адвокаты", source: "research", source_url: "", market_score: 7, competition_score: 8, monetization_score: 8, build_difficulty: 7, total_score: 7.6, reasoning: "Юристы платят хорошо, нишевый формат создаёт барьер", tags: ["AI Agent","Legal","Productivity"], status: "new" },
  { title: "Competitor Price Monitor", description: "Мониторит цены конкурентов на конкретной нише и присылает алерты.", problem: "E-commerce теряет продажи из-за неконкурентных цен", target_audience: "E-commerce sellers, SaaS", source: "research", source_url: "", market_score: 7, competition_score: 6, monetization_score: 8, build_difficulty: 8, total_score: 7.4, reasoning: "Быстрый build, чёткий ROI для клиента", tags: ["SaaS","Pricing","Monitor"], status: "new" },
  { title: "ContentAgent «Record Once»", description: "AI агент превращает podcast/видео во все форматы и публикует везде автоматически.", problem: "Создатели тратят 4-8 часов на перепаковку одного эпизода", target_audience: "Podcast creators, YouTubers, маркетологи", source: "research", source_url: "", market_score: 9, competition_score: 7, monetization_score: 7, build_difficulty: 5, total_score: 7.4, reasoning: "После 3 месяцев агент знает голос creator — мощный lock-in", tags: ["AI Agent","Content","Creator"], status: "new" },
  { title: "OnboardingAgent", description: "AI агент который персонализирует onboarding для каждого нового пользователя B2B SaaS.", problem: "60% пользователей уходят в первые 30 дней из-за плохого onboarding", target_audience: "B2B SaaS компании", source: "research", source_url: "", market_score: 8, competition_score: 6, monetization_score: 8, build_difficulty: 6, total_score: 7.3, reasoning: "Прямой impact на churn, легко считается ROI", tags: ["AI Agent","SaaS","Onboarding"], status: "new" },
  { title: "ChurnPredictAgent", description: "AI анализирует поведение пользователей и автоматически запускает re-engagement до того как они уйдут.", problem: "SaaS теряет 5-7% клиентов каждый месяц", target_audience: "SaaS компании с 100+ клиентами", source: "research", source_url: "", market_score: 8, competition_score: 6, monetization_score: 8, build_difficulty: 6, total_score: 7.3, reasoning: "Удержание в 5x дешевле привлечения, измеримый ROI", tags: ["AI Agent","SaaS","Analytics"], status: "new" },
  { title: "ReviewAgent", description: "AI автоматически отвечает на Google/Yelp отзывы и просит довольных клиентов оставить отзыв.", problem: "Малый бизнес теряет клиентов из-за нет ответов на отзывы", target_audience: "Малый бизнес (рестораны, салоны, клиники)", source: "research", source_url: "", market_score: 8, competition_score: 7, monetization_score: 7, build_difficulty: 8, total_score: 7.2, reasoning: "Огромный рынок малого бизнеса, быстрый build", tags: ["AI Agent","Reviews","Local"], status: "new" },
  { title: "ProposalAgent", description: "AI пишет профессиональные проектные предложения по краткому описанию работы за 2 минуты.", problem: "Фрилансеры тратят 2-4 часа на каждый proposal", target_audience: "Фрилансеры, консультанты, агентства", source: "research", source_url: "", market_score: 7, competition_score: 6, monetization_score: 7, build_difficulty: 8, total_score: 7.1, reasoning: "Быстрый build, прямая экономия времени", tags: ["AI Agent","Freelance","Productivity"], status: "new" },
  { title: "ScopeCreepGuard", description: "AI мониторит переписку с клиентами и алертит когда задача выходит за рамки контракта.", problem: "Фрилансеры теряют 20-30% дохода из-за scope creep", target_audience: "Фрилансеры, небольшие агентства", source: "research", source_url: "", market_score: 6, competition_score: 9, monetization_score: 7, build_difficulty: 8, total_score: 7.0, reasoning: "Уникальная ниша, нет прямых конкурентов", tags: ["AI Agent","Freelance","Legal"], status: "new" },
]

async function seed() {
  console.log(`Заполняю базу данных... ${ideas.length} идей`)

  let saved = 0
  let skipped = 0

  for (const idea of ideas) {
    const { error } = await supabase.from('ideas').upsert(idea, { onConflict: 'title' })
    if (error) {
      console.error(`❌ Ошибка: ${idea.title} — ${error.message}`)
    } else {
      saved++
      console.log(`✅ ${idea.title}`)
    }
  }

  console.log(`\nГотово! Сохранено: ${saved}/${ideas.length}`)
}

seed().catch(console.error)
