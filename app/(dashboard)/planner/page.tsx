"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Check, Pencil } from "lucide-react"
import {
  defaultTasks,
  categoryColor,
  type Task,
  type TaskCategory,
  type TaskPriority,
} from "@/lib/tasks"
import { Modal, fieldStyle, labelStyle, fieldGroupStyle, SubmitButton } from "@/components/modal"
import { MetricCard } from "@/components/metric-card"
import { logHistory } from "@/lib/history"
import { useLang } from "@/lib/lang"
import { t } from "@/lib/translations"

const CUSTOM_KEY = "ailnex_custom_tasks"
const DONE_KEY = "ailnex_task_done"
const TASK_EDITS_KEY = "ailnex_task_edits"

type TaskWithSource = Task & { source?: string; done?: boolean }

const CATEGORIES: TaskCategory[] = ["money", "work", "call", "other"]

// ─── LocalStorage ─────────────────────────────────────────────────────────────

function loadCustom(): Task[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]") } catch { return [] }
}

function saveCustom(tasks: Task[]) { localStorage.setItem(CUSTOM_KEY, JSON.stringify(tasks)) }

function loadTaskEdits(): Record<string, Partial<Task>> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(TASK_EDITS_KEY) || "{}") } catch { return {} }
}

function saveTaskEdits(e: Record<string, Partial<Task>>) {
  localStorage.setItem(TASK_EDITS_KEY, JSON.stringify(e))
}

function loadDone(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(DONE_KEY) || "{}") } catch { return {} }
}

function saveDone(d: Record<string, boolean>) { localStorage.setItem(DONE_KEY, JSON.stringify(d)) }

// ─── Date helpers ──────────────────────────────────────────────────────────────

type Group = "overdue" | "today" | "tomorrow" | "week" | "later" | "nodate"

function getGroup(dueDate?: string): Group {
  if (!dueDate) return "nodate"
  const due = new Date(dueDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diff = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return "overdue"
  if (diff === 0) return "today"
  if (diff === 1) return "tomorrow"
  if (diff <= 7) return "week"
  return "later"
}

const GROUP_ORDER: Group[] = ["overdue", "today", "tomorrow", "week", "later", "nodate"]

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" })
}

// ─── Add Task Modal ────────────────────────────────────────────────────────────

function TaskFormModal({ initial, onSave, onClose }: {
  initial?: Task
  onSave: (t: Task) => void
  onClose: () => void
}) {
  const { lang } = useLang()
  const p = t.planner
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    notes: initial?.notes ?? "",
    category: initial?.category ?? "work" as TaskCategory,
    priority: initial?.priority ?? "normal" as TaskPriority,
    dueDate: initial?.dueDate ?? "",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const fo = (e: React.FocusEvent) => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"
  const bl = (e: React.FocusEvent) => (e.target as HTMLElement).style.borderColor = "var(--border)"

  const priorities: { value: TaskPriority; label: string }[] = [
    { value: "high", label: p.high[lang] },
    { value: "normal", label: p.normal[lang] },
    { value: "low", label: p.low[lang] },
  ]

  const catLabel: Record<TaskCategory, string> = {
    money: p.money[lang],
    work: p.work[lang],
    call: p.call[lang],
    other: p.other[lang],
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      id: initial?.id ?? `task-${Date.now()}`,
      title: form.title.trim(),
      notes: form.notes.trim() || undefined,
      category: form.category,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
    })
    onClose()
  }

  return (
    <Modal title={initial ? p.editTask[lang] : p.newTaskTitle[lang]} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{p.taskName[lang]}</label>
          <input style={fieldStyle} value={form.title} onChange={e => set("title", e.target.value)}
            placeholder={p.taskNamePlaceholder[lang]} autoFocus onFocus={fo} onBlur={bl} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{p.notesLabel[lang]}</label>
          <textarea style={{ ...fieldStyle, resize: "vertical", minHeight: 64 }}
            value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder={p.notesPlaceholder[lang]} onFocus={fo} onBlur={bl} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>{p.category[lang]}</label>
            <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.category}
              onChange={e => set("category", e.target.value)} onFocus={fo} onBlur={bl}>
              {CATEGORIES.map(c => <option key={c} value={c}>{catLabel[c]}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{p.priority[lang]}</label>
            <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.priority}
              onChange={e => set("priority", e.target.value)} onFocus={fo} onBlur={bl}>
              {priorities.map(pr => <option key={pr.value} value={pr.value}>{pr.label}</option>)}
            </select>
          </div>
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{p.dueDateLabel[lang]}</label>
          <input type="date" style={{ ...fieldStyle, colorScheme: "dark" }} value={form.dueDate}
            onChange={e => set("dueDate", e.target.value)} onFocus={fo} onBlur={bl} />
        </div>
        <SubmitButton label={initial ? p.saveBtn[lang] : p.addTaskBtn[lang]} />
      </form>
    </Modal>
  )
}

// ─── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, done, onToggle, onDelete, onEdit, onClick, isBot }: {
  task: Task
  done: boolean
  onToggle: () => void
  onDelete?: () => void
  onEdit?: () => void
  onClick: () => void
  isBot?: boolean
}) {
  const { lang } = useLang()
  const p = t.planner
  const [hovered, setHovered] = useState(false)
  const catColor = categoryColor[task.category]
  const locale = lang === "ru" ? "ru-RU" : "en-US"

  const catLabel: Record<TaskCategory, string> = {
    money: p.money[lang],
    work: p.work[lang],
    call: p.call[lang],
    other: p.other[lang],
  }

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 14px",
        background: done ? "transparent" : "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${done ? "var(--border)" : catColor}`,
        borderRadius: 10,
        cursor: "pointer",
        transition: "all 0.15s",
        opacity: done ? 0.5 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onToggle() }}
        style={{
          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
          border: `2px solid ${done ? catColor : "var(--border)"}`,
          background: done ? catColor : "transparent",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}
      >
        {done && <Check size={11} color="#fff" strokeWidth={3} />}
      </button>

      {/* Title + notes */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500,
          color: done ? "var(--text-muted)" : "var(--text-primary)",
          textDecoration: done ? "line-through" : "none",
          lineHeight: 1.3,
        }}>
          {task.title}
        </div>
        {task.notes && !done && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {task.notes}
          </div>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {isBot && !done && (
          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 20, background: "rgba(99,102,241,0.1)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            🤖
          </span>
        )}
        {task.priority === "high" && !done && (
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}>
            {p.high[lang]}
          </span>
        )}
        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}25` }}>
          {catLabel[task.category]}
        </span>
        {task.dueDate && (
          <span style={{ fontSize: 11, color: getGroup(task.dueDate) === "overdue" ? "#EF4444" : "var(--text-muted)" }}>
            {formatDate(task.dueDate, locale)}
          </span>
        )}
        {onEdit && hovered && (
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, lineHeight: 1, opacity: 0.6, transition: "opacity 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.6"}
          >
            <Pencil size={13} />
          </button>
        )}
        {onDelete && hovered && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 2, lineHeight: 1, opacity: 0.6, transition: "opacity 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.6"}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

function TaskDetailPanel({ task, done, onToggle, onClose }: {
  task: Task
  done: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const { lang } = useLang()
  const p = t.planner
  const [notes, setNotes] = useState("")
  const catColor = categoryColor[task.category]
  const locale = lang === "ru" ? "ru-RU" : "en-US"

  const catLabel: Record<TaskCategory, string> = {
    money: p.money[lang],
    work: p.work[lang],
    call: p.call[lang],
    other: p.other[lang],
  }

  const groupMeta: Record<Group, { label: string; color: string }> = {
    overdue: { label: `🔴 ${p.overdueGroup[lang]}`, color: "#EF4444" },
    today: { label: `📅 ${p.todayGroup[lang]}`, color: "#6366F1" },
    tomorrow: { label: `📆 ${p.tomorrowGroup[lang]}`, color: "#F59E0B" },
    week: { label: `📋 ${p.weekGroup[lang]}`, color: "#3B82F6" },
    later: { label: `🗓 ${p.laterGroup[lang]}`, color: "#525472" },
    nodate: { label: `📌 ${p.nodateGroup[lang]}`, color: "#525472" },
  }

  useEffect(() => {
    setNotes(localStorage.getItem(`ailnex_notes_${task.id}`) || task.notes || "")
  }, [task.id, task.notes])

  const saveNotes = (val: string) => {
    setNotes(val)
    localStorage.setItem(`ailnex_notes_${task.id}`, val)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.3)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 901,
        width: 360, background: "var(--bg-surface)", borderLeft: "1px solid var(--border)",
        padding: "24px 24px 32px", overflowY: "auto",
        boxShadow: "-12px 0 40px rgba(0,0,0,0.4)", animation: "slideIn 0.2s ease",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, fontSize: 18, lineHeight: 1 }}>✕</button>

        {/* Category + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}25` }}>
            {catLabel[task.category]}
          </span>
          {task.priority === "high" && (
            <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {p.high[lang]}
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: 18, fontWeight: 700, color: done ? "var(--text-muted)" : "var(--text-primary)", lineHeight: 1.3, marginBottom: 16, textDecoration: done ? "line-through" : "none" }}>
          {task.title}
        </div>

        {/* Date */}
        {task.dueDate && (
          <div style={{ fontSize: 12, color: getGroup(task.dueDate) === "overdue" ? "#EF4444" : "var(--text-muted)", marginBottom: 16 }}>
            📅 {formatDate(task.dueDate, locale)} · {groupMeta[getGroup(task.dueDate)].label}
          </div>
        )}

        {/* Toggle done */}
        <button
          onClick={onToggle}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
            background: done ? "rgba(34,197,94,0.12)" : "var(--bg-elevated)",
            border: `1px solid ${done ? "#22C55E" : "var(--border)"}`,
            borderRadius: 8, cursor: "pointer", marginBottom: 20,
            color: done ? "#22C55E" : "var(--text-secondary)",
            fontSize: 13, fontWeight: 500, transition: "all 0.15s",
          }}
        >
          <Check size={14} />
          {done
            ? (lang === "ru" ? "Отметить как активную" : "Mark as active")
            : (lang === "ru" ? "Отметить выполненной" : "Mark as done")}
        </button>

        {/* Notes */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
          {p.notesLabel[lang]}
        </div>
        <textarea
          value={notes}
          onChange={e => saveNotes(e.target.value)}
          placeholder={p.notesPlaceholder[lang]}
          style={{ width: "100%", minHeight: 140, padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
          onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
          onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
        />
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          {lang === "ru" ? "Сохраняется автоматически" : "Auto-saved"}
        </div>
      </div>
    </>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Filter = "all" | "active" | "done"

export default function PlannerPage() {
  const { lang } = useLang()
  const p = t.planner
  const locale = lang === "ru" ? "ru-RU" : "en-US"

  const [customTasks, setCustomTasks] = useState<Task[]>([])
  const [botTasks, setBotTasks] = useState<TaskWithSource[]>([])
  const [taskEdits, setTaskEdits] = useState<Record<string, Partial<Task>>>({})
  const [doneState, setDoneState] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<Filter>("active")
  const [catFilter, setCatFilter] = useState<TaskCategory | "all">("all")
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [mounted, setMounted] = useState(false)

  const groupMeta: Record<Group, { label: string; color: string }> = {
    overdue: { label: `🔴 ${p.overdueGroup[lang]}`, color: "#EF4444" },
    today: { label: `📅 ${p.todayGroup[lang]}`, color: "#6366F1" },
    tomorrow: { label: `📆 ${p.tomorrowGroup[lang]}`, color: "#F59E0B" },
    week: { label: `📋 ${p.weekGroup[lang]}`, color: "#3B82F6" },
    later: { label: `🗓 ${p.laterGroup[lang]}`, color: "#525472" },
    nodate: { label: `📌 ${p.nodateGroup[lang]}`, color: "#525472" },
  }

  useEffect(() => {
    setCustomTasks(loadCustom())
    setDoneState(loadDone())
    setTaskEdits(loadTaskEdits())
    setMounted(true)
    fetch("/api/tasks")
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setBotTasks(data) : [])
      .catch(() => {})
  }, [])

  if (!mounted) return null

  const botTaskIds = new Set(botTasks.map(task => task.id))
  const allTasks: TaskWithSource[] = [
    ...defaultTasks.map(task => ({ ...task, ...taskEdits[task.id] })),
    ...botTasks.filter(task => !task.done).map(task => ({ ...task, ...taskEdits[task.id] })),
    ...customTasks.map(task => ({ ...task, ...taskEdits[task.id] })),
  ]

  const isDone = (id: string) => doneState[id] ?? false

  const toggleDone = (id: string, title: string) => {
    const next = !isDone(id)
    const updated = { ...doneState, [id]: next }
    setDoneState(updated)
    saveDone(updated)
    if (next) logHistory({ action: "moved", itemType: "order", itemTitle: title, from: "Активная", to: "Выполнено" })
  }

  const handleAdd = (task: Task) => {
    const updated = [...customTasks, task]
    setCustomTasks(updated)
    saveCustom(updated)
    logHistory({ action: "added", itemType: "order", itemTitle: task.title })
  }

  const handleEditSave = (task: Task) => {
    const isCustom = task.id.startsWith("task-")
    if (isCustom) {
      const updated = customTasks.map(c => c.id === task.id ? task : c)
      setCustomTasks(updated)
      saveCustom(updated)
    } else {
      const updated = { ...taskEdits, [task.id]: task }
      setTaskEdits(updated)
      saveTaskEdits(updated)
    }
    if (detailTask?.id === task.id) setDetailTask(task)
  }

  const handleDelete = (id: string) => {
    if (botTaskIds.has(id)) {
      fetch(`/api/tasks?id=${id}`, { method: "DELETE" }).catch(() => {})
      setBotTasks(prev => prev.filter(task => task.id !== id))
      return
    }
    const task = customTasks.find(task => task.id === id)
    const updated = customTasks.filter(task => task.id !== id)
    setCustomTasks(updated)
    saveCustom(updated)
    if (task) logHistory({ action: "deleted", itemType: "order", itemTitle: task.title })
  }

  // Apply filters
  const filtered = allTasks.filter(task => {
    if (filter === "active" && isDone(task.id)) return false
    if (filter === "done" && !isDone(task.id)) return false
    if (catFilter !== "all" && task.category !== catFilter) return false
    return true
  })

  // Group
  const grouped = GROUP_ORDER.reduce<Record<Group, Task[]>>((acc, g) => {
    acc[g] = filtered.filter(task => getGroup(task.dueDate) === g)
    return acc
  }, { overdue: [], today: [], tomorrow: [], week: [], later: [], nodate: [] })

  // Metrics (active only)
  const activeTasks = allTasks.filter(task => !isDone(task.id))
  const overdueCount = activeTasks.filter(task => getGroup(task.dueDate) === "overdue").length
  const todayCount = activeTasks.filter(task => getGroup(task.dueDate) === "today").length

  const filterBtn = (value: Filter, label: string) => (
    <button
      onClick={() => setFilter(value)}
      style={{
        padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
        border: "1px solid var(--border)", cursor: "pointer",
        background: filter === value ? "var(--accent)" : "var(--bg-surface)",
        color: filter === value ? "#fff" : "var(--text-secondary)",
        transition: "all 0.15s",
      }}
    >{label}</button>
  )

  const catFilters: [string, string][] = [
    ["all", lang === "ru" ? "Все категории" : "All categories"],
    ["money", "💰"],
    ["work", "🛠"],
    ["call", "📞"],
    ["other", "📌"],
  ]

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
            {p.title[lang]}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
            {activeTasks.length} {lang === "ru" ? "активных" : "active"} · {allTasks.filter(task => isDone(task.id)).length} {lang === "ru" ? "выполнено" : "completed"}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
        >
          <Plus size={14} /> {p.newTask[lang]}
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <MetricCard emoji="📋" value={activeTasks.length} label={p.totalTasks[lang]} color="var(--accent)" />
        <MetricCard emoji="📅" value={todayCount} label={p.todayGroup[lang]} color="#6366F1" />
        <MetricCard emoji="🔴" value={overdueCount} label={p.overdueGroup[lang]} color={overdueCount > 0 ? "#EF4444" : "var(--text-muted)"} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {filterBtn("all", p.all[lang])}
          {filterBtn("active", p.active[lang])}
          {filterBtn("done", p.done[lang])}
        </div>
        <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 4px" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {catFilters.map(([val, lbl]) => (
            <button key={val}
              onClick={() => setCatFilter(val as TaskCategory | "all")}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                border: "1px solid var(--border)",
                background: catFilter === val ? "var(--bg-elevated)" : "transparent",
                color: catFilter === val ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: catFilter === val ? 600 : 400,
                transition: "all 0.15s",
              }}
            >{lbl}</button>
          ))}
        </div>
      </div>

      {/* Groups */}
      {filtered.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          {filter === "done"
            ? (lang === "ru" ? "Нет выполненных задач." : "No completed tasks.")
            : (lang === "ru" ? "Нет задач. Нажми + чтобы добавить." : "No tasks. Press + to add one.")}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {GROUP_ORDER.map(group => {
          const tasks = grouped[group]
          if (tasks.length === 0) return null
          const meta = groupMeta[group]
          return (
            <div key={group}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: meta.color }}>{meta.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: 10 }}>
                  {tasks.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    done={isDone(task.id)}
                    onToggle={() => toggleDone(task.id, task.title)}
                    onEdit={() => setEditTask(task)}
                    onDelete={(task.id.startsWith("task-") || botTaskIds.has(task.id)) ? () => handleDelete(task.id) : undefined}
                    onClick={() => setDetailTask(task)}
                    isBot={botTaskIds.has(task.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && <TaskFormModal onSave={handleAdd} onClose={() => setShowModal(false)} />}
      {editTask && <TaskFormModal initial={editTask} onSave={task => { handleEditSave(task); setEditTask(null) }} onClose={() => setEditTask(null)} />}
      {detailTask && (
        <TaskDetailPanel
          task={detailTask}
          done={isDone(detailTask.id)}
          onToggle={() => toggleDone(detailTask.id, detailTask.title)}
          onClose={() => setDetailTask(null)}
        />
      )}
    </div>
  )
}
