"use client"

import { useState, useEffect } from "react"
import { loadHistory, type HistoryEntry } from "@/lib/history"

const actionLabel: Record<HistoryEntry["action"], string> = {
  moved: "переместил",
  added: "добавил",
  deleted: "удалил",
}

const actionColor: Record<HistoryEntry["action"], string> = {
  moved: "#6366F1",
  added: "#22C55E",
  deleted: "#EF4444",
}

const typeLabel: Record<HistoryEntry["itemType"], string> = {
  project: "проект",
  order: "заказ",
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])

  useEffect(() => {
    setEntries(loadHistory())
  }, [])

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
          История изменений
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
          {entries.length} событий · последние {Math.min(entries.length, 100)}
        </p>
      </div>

      {entries.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Пока нет событий. История появится когда начнёшь перемещать карточки.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map(entry => {
          const color = actionColor[entry.action]
          return (
            <div key={entry.id} style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderLeft: `3px solid ${color}`,
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                  {typeLabel[entry.itemType].charAt(0).toUpperCase() + typeLabel[entry.itemType].slice(1)}{" "}
                </span>
                <span style={{ fontSize: 13, color, fontWeight: 600 }}>
                  {actionLabel[entry.action]}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                  {" "}«{entry.itemTitle}»
                </span>
                {entry.action === "moved" && entry.from && entry.to && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {" "}· {entry.from} → {entry.to}
                  </span>
                )}
                {entry.action === "added" && entry.to && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {" "}· в {entry.to}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                {formatDate(entry.date)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
