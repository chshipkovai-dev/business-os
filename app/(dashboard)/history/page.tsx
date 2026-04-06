"use client"

import { useState, useEffect } from "react"
import { loadHistory, type HistoryEntry } from "@/lib/history"
import { useLang } from "@/lib/lang"
import { t } from "@/lib/translations"

const actionColor: Record<HistoryEntry["action"], string> = {
  moved: "#6366F1",
  added: "#22C55E",
  deleted: "#EF4444",
}

function formatDate(iso: string, locale: string) {
  const d = new Date(iso)
  return d.toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default function HistoryPage() {
  const { lang } = useLang()
  const h = t.history
  const locale = lang === "ru" ? "ru-RU" : "en-US"

  const actionLabel: Record<HistoryEntry["action"], string> = {
    moved: h.moved[lang],
    added: h.added[lang],
    deleted: h.deleted[lang],
  }

  const typeLabel: Record<HistoryEntry["itemType"], string> = {
    project: h.project[lang],
    order: h.order[lang],
  }

  const [entries, setEntries] = useState<HistoryEntry[]>([])

  useEffect(() => {
    setEntries(loadHistory())
  }, [])

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
          {h.title[lang]}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
          {entries.length} {lang === "ru" ? "событий · последние" : "events · last"} {Math.min(entries.length, 100)}
        </p>
      </div>

      {entries.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          {h.empty[lang]}
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
                    {" "}· {h.to[lang]} {entry.to}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                {formatDate(entry.date, locale)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
