"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ExternalLink, ArrowRight, Pencil } from "lucide-react"
import { type CompanyProject, stageLabel, stageColor, stageEmoji } from "@/lib/company-projects"
import { type Order, statusLabel, statusColor, statusEmoji } from "@/lib/orders"

const NOTES_PREFIX = "ailnex_notes_"

function loadNote(id: string): string {
  try { return localStorage.getItem(NOTES_PREFIX + id) || "" } catch { return "" }
}

function saveNote(id: string, text: string) {
  localStorage.setItem(NOTES_PREFIX + id, text)
}

// ─── Project Panel ─────────────────────────────────────────────────────────────

export function ProjectDetailPanel({ project, onClose, onEdit }: {
  project: CompanyProject
  onClose: () => void
  onEdit?: () => void
}) {
  const [notes, setNotes] = useState("")
  const color = stageColor[project.stage]

  useEffect(() => {
    setNotes(loadNote(project.id))
  }, [project.id])

  const handleNotesChange = useCallback((val: string) => {
    setNotes(val)
    saveNote(project.id, val)
  }, [project.id])

  return (
    <PanelShell onClose={onClose} onEdit={onEdit}>
      {/* Stage badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 14 }}>{stageEmoji[project.stage]}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.2px" }}>
          {stageLabel[project.stage]}
        </span>
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--accent)", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.7"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
            Открыть <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 10 }}>
        {project.title}
      </div>

      {/* Description */}
      {project.description && (
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
          {project.description}
        </div>
      )}

      {/* Tags */}
      {project.tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {project.tags.map(tag => (
            <span key={tag} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Next step */}
      {project.nextStep && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 8, background: `${color}12`, border: `1px solid ${color}25`, marginBottom: 20 }}>
          <ArrowRight size={12} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{project.nextStep}</span>
        </div>
      )}

      <NotesField value={notes} onChange={handleNotesChange} />
    </PanelShell>
  )
}

// ─── Order Panel ───────────────────────────────────────────────────────────────

export function OrderDetailPanel({ order, onClose, onEdit }: {
  order: Order
  onClose: () => void
  onEdit?: () => void
}) {
  const [notes, setNotes] = useState("")
  const color = statusColor[order.status]

  useEffect(() => {
    setNotes(loadNote(order.id))
  }, [order.id])

  const handleNotesChange = useCallback((val: string) => {
    setNotes(val)
    saveNote(order.id, val)
  }, [order.id])

  return (
    <PanelShell onClose={onClose} onEdit={onEdit}>
      {/* Status badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 14 }}>{statusEmoji[order.status]}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.2px" }}>
          {statusLabel[order.status]}
        </span>
        {order.source && (
          <span style={{ marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            {order.source}
          </span>
        )}
      </div>

      {/* Client */}
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {order.client}
      </div>

      {/* Title */}
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 10 }}>
        {order.title}
      </div>

      {/* Description */}
      {order.description && (
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
          {order.description}
        </div>
      )}

      {/* Budget */}
      {order.budget && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Бюджет</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#22C55E" }}>{order.budget}</div>
        </div>
      )}

      {/* Deadline */}
      {order.deadline && (
        <DeadlineBadge deadline={order.deadline} />
      )}

      {/* Original notes from data */}
      {order.notes && (
        <div style={{ padding: "10px 12px", borderRadius: 8, background: `${color}12`, border: `1px solid ${color}25`, marginBottom: 20, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {order.notes}
        </div>
      )}

      <NotesField value={notes} onChange={handleNotesChange} />
    </PanelShell>
  )
}

// ─── Deadline Badge ────────────────────────────────────────────────────────────

function DeadlineBadge({ deadline }: { deadline: string }) {
  const date = new Date(deadline)
  const now = new Date()
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const overdue = diff < 0
  const soon = diff >= 0 && diff <= 7

  const color = overdue ? "#EF4444" : soon ? "#F59E0B" : "var(--text-muted)"
  const label = overdue ? `Просрочен на ${Math.abs(diff)} дн.` : diff === 0 ? "Сегодня" : `${diff} дн. осталось`

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Дедлайн</span>
      <span style={{ fontSize: 12, fontWeight: 600, color, background: `${color}18`, padding: "2px 8px", borderRadius: 6 }}>
        {date.toLocaleDateString("ru-RU")} · {label}
      </span>
    </div>
  )
}

// ─── Notes Field ───────────────────────────────────────────────────────────────

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
        Заметки
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Пиши здесь..."
        style={{
          width: "100%",
          minHeight: 140,
          padding: "10px 12px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          fontSize: 13,
          color: "var(--text-primary)",
          outline: "none",
          fontFamily: "inherit",
          resize: "vertical",
          lineHeight: 1.6,
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
        onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
        onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
      />
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Сохраняется автоматически</div>
    </div>
  )
}

// ─── Panel Shell ───────────────────────────────────────────────────────────────

function PanelShell({ children, onClose, onEdit }: { children: React.ReactNode; onClose: () => void; onEdit?: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.3)" }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 901,
        width: 360,
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--border)",
        padding: "56px 24px 32px",
        overflowY: "auto",
        boxShadow: "-12px 0 40px rgba(0,0,0,0.4)",
        animation: "slideIn 0.2s ease",
      }}>
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", alignItems: "center", gap: 4 }}>
          {onEdit && (
            <button
              onClick={onEdit}
              title="Редактировать"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6, lineHeight: 1 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            >
              <Pencil size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6, lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </>
  )
}
