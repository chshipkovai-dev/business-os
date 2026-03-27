const HISTORY_KEY = "ailnex_history"
const MAX_ENTRIES = 100

export interface HistoryEntry {
  id: string
  date: string        // ISO string
  action: "moved" | "added" | "deleted"
  itemType: "project" | "order"
  itemTitle: string
  from?: string
  to?: string
}

export function logHistory(entry: Omit<HistoryEntry, "id" | "date">) {
  if (typeof window === "undefined") return
  try {
    const existing: HistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
    const newEntry: HistoryEntry = {
      ...entry,
      id: `h-${Date.now()}`,
      date: new Date().toISOString(),
    }
    const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") } catch { return [] }
}
