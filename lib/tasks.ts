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
export const defaultTasks: Task[] = []
