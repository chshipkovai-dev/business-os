export type TaskCategory = "money" | "work" | "call" | "other"
export type TaskPriority = "high" | "normal" | "low"

export interface Task {
  id: string
  title: string
  notes?: string
  dueDate?: string        // ISO: "2026-04-01"
  category: TaskCategory
  priority: TaskPriority
}

export const categoryLabel: Record<TaskCategory, string> = {
  money: "💰 Деньги",
  work: "🛠 Работа",
  call: "📞 Звонки",
  other: "📌 Другое",
}

export const categoryColor: Record<TaskCategory, string> = {
  money: "#22C55E",
  work: "#6366F1",
  call: "#F59E0B",
  other: "#525472",
}

// Denis говорит "запиши" — Claude добавляет задачи сюда
export const defaultTasks: Task[] = [
  {
    id: "default-0",
    title: "Ailnex.com — анализ и переработка UI",
    notes: "Провести полный аудит сайта: найти ошибки, что не нравится в дизайне, переделать UI. Главная задача дня.",
    dueDate: "2026-03-28",
    category: "work",
    priority: "high",
  },
  {
    id: "default-1",
    title: "Добавить INTERNAL_TOKEN в Vercel",
    notes: "Vercel Dashboard → проект → Settings → Environment Variables → INTERNAL_TOKEN = ailnex_internal_2026",
    dueDate: "2026-03-28",
    category: "work",
    priority: "normal",
  },
  {
    id: "default-2",
    title: "Установить Telegram webhook для бота",
    notes: "Открыть в браузере: https://api.telegram.org/botBOT_TOKEN/setWebhook?url=https://business-os-alpha-rust.vercel.app/api/telegram",
    dueDate: "2026-03-28",
    category: "work",
    priority: "normal",
  },
]
