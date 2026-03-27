export type CompanyProjectStage = "idea" | "building" | "launched" | "frozen"

export interface CompanyProject {
  id: string
  title: string
  description: string
  stage: CompanyProjectStage
  url?: string
  nextStep?: string
  tags: string[]
}

export const companyProjects: CompanyProject[] = [
  {
    id: "ailnex",
    title: "Ailnex",
    description: "Automation agency — помогаем бизнесу автоматизировать процессы через AI и n8n.",
    stage: "launched",
    url: "https://ailnex.com",
    nextStep: "Снять видео, подключить GA4, запустить первые лиды",
    tags: ["agency", "automation", "AI"],
  },
  {
    id: "invoicepilot",
    title: "InvoicePilot",
    description: "AI генерирует 3 письма-напоминания для неоплаченных инвойсов. Для фрилансеров. $39/мес.",
    stage: "launched",
    url: "https://invoicepilot.app",
    nextStep: "Запустить маркетинг, первые платящие клиенты",
    tags: ["SaaS", "invoices", "freelancers"],
  },
  {
    id: "reviewagent",
    title: "ReviewAgent",
    description: "AI генерирует ответы на отзывы Google/Yelp. Для ресторанов, салонов, стоматологий. $49/мес.",
    stage: "building",
    nextStep: "Доделать MVP, записать демо, найти первых клиентов",
    tags: ["SaaS", "reviews", "local business"],
  },
  {
    id: "tereza",
    title: "Tereza — AI Recepční",
    description: "AI-ресепшн для чешских beauty-салонов. Принимает звонки, записывает клиентов. Лендинг live.",
    stage: "launched",
    url: "https://reception-ai.cz",
    nextStep: "Найти первых клиентов в Праге",
    tags: ["AI", "beauty", "Czech market"],
  },
  {
    id: "czechpass",
    title: "CzechPass",
    description: "AI подготовка к экзамену на ПМЖ (A2 чешский) для русскоязычных в ЧР.",
    stage: "idea",
    nextStep: "Phase 0: домен + GitHub + Supabase + Telegram бот",
    tags: ["EdTech", "Czech", "language learning"],
  },
  {
    id: "contractagent",
    title: "ContractAgent",
    description: "AI анализ контрактов для B2B. Заморожен — длинный цикл продаж, CFO трудно достичь.",
    stage: "frozen",
    tags: ["SaaS", "B2B", "contracts"],
  },
]

export const stageLabel: Record<CompanyProjectStage, string> = {
  idea: "Идея",
  building: "Разработка",
  launched: "Запущен",
  frozen: "Заморожен",
}

export const stageColor: Record<CompanyProjectStage, string> = {
  idea: "#F59E0B",
  building: "#6366F1",
  launched: "#22C55E",
  frozen: "#525472",
}

export const stageEmoji: Record<CompanyProjectStage, string> = {
  idea: "💡",
  building: "🛠",
  launched: "🚀",
  frozen: "❄️",
}
