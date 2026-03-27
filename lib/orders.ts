export type OrderStatus = "new" | "discussion" | "in_progress" | "done" | "invoiced"

export interface Order {
  id: string
  client: string
  title: string
  description: string
  status: OrderStatus
  source?: string      // Upwork, Referral, Ailnex, Direct
  budget?: string      // "50k CZK", "$500", etc.
  deadline?: string
  notes?: string
}

export const orders: Order[] = [
  {
    id: "access-web-portal",
    client: "Чешский клиент",
    title: "Access → Web портал",
    description: "Перенос базы данных Access в веб-приложение. Бюджет 50–100k CZK.",
    status: "discussion",
    source: "Referral",
    budget: "50–100k CZK",
    notes: "Звонок 26 марта. Уточнить требования, текущий стек, сроки.",
  },
]

export const statusLabel: Record<OrderStatus, string> = {
  new: "Новый",
  discussion: "Переговоры",
  in_progress: "В работе",
  done: "Готово",
  invoiced: "Выставлен счёт",
}

export const statusColor: Record<OrderStatus, string> = {
  new: "#6366F1",
  discussion: "#F59E0B",
  in_progress: "#3B82F6",
  done: "#22C55E",
  invoiced: "#525472",
}

export const statusEmoji: Record<OrderStatus, string> = {
  new: "🆕",
  discussion: "💬",
  in_progress: "🔨",
  done: "✅",
  invoiced: "🧾",
}
