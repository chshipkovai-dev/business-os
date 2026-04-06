"use client"

import { useState, useEffect } from "react"
import { DndContext, DragOverlay, useDroppable, useDraggable, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { statusColor, type OrderStatus } from "@/lib/orders"
import { Modal, fieldStyle, labelStyle, fieldGroupStyle, SubmitButton } from "@/components/modal"
import { MetricCard } from "@/components/metric-card"
import { logHistory } from "@/lib/history"
import { useLang } from "@/lib/lang"
import { t } from "@/lib/translations"

const COLUMNS: OrderStatus[] = ["new", "discussion", "in_progress", "done", "invoiced"]
const SOURCES = ["Upwork", "Referral", "Ailnex", "Direct", "Другое"]

interface DBOrder {
  id: string
  client: string
  title: string
  description?: string | null
  status: OrderStatus
  source?: string | null
  budget?: string | null
  deadline?: string | null
  notes?: string | null
  project_id?: string | null
}

interface DBProject {
  id: string
  title: string
}

// ─── Order Form Modal ─────────────────────────────────────────────────────────

function OrderFormModal({ initial, projects, onSave, onClose }: {
  initial?: DBOrder
  projects: DBProject[]
  onSave: (o: Partial<DBOrder>) => void
  onClose: () => void
}) {
  const { lang } = useLang()
  const o = t.ordersPage
  const statusLabels: Record<OrderStatus, string> = {
    new: o.new[lang], discussion: o.discussion[lang], in_progress: o.inProgressStatus[lang],
    done: o.done[lang], invoiced: o.invoiced[lang],
  }
  const statusEmojis: Record<OrderStatus, string> = { new: "🆕", discussion: "💬", in_progress: "🔨", done: "✅", invoiced: "🧾" }

  const [form, setForm] = useState({
    client: initial?.client ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "new" as OrderStatus,
    source: initial?.source ?? "",
    budget: initial?.budget ?? "",
    deadline: initial?.deadline ?? "",
    notes: initial?.notes ?? "",
    project_id: initial?.project_id ?? "",
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const fo = (e: React.FocusEvent) => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"
  const bl = (e: React.FocusEvent) => (e.target as HTMLElement).style.borderColor = "var(--border)"

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      client: form.client.trim() || "—",
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      source: form.source || null,
      budget: form.budget.trim() || null,
      deadline: form.deadline || null,
      notes: form.notes.trim() || null,
      project_id: form.project_id || null,
    })
    onClose()
  }

  return (
    <Modal title={initial ? o.editOrder[lang] : o.newOrderTitle[lang]} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{o.orderName[lang]}</label>
          <input style={fieldStyle} value={form.title} onChange={e => set("title", e.target.value)}
            placeholder={o.orderNamePlaceholder[lang]} autoFocus onFocus={fo} onBlur={bl} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{o.client[lang]}</label>
          <input style={fieldStyle} value={form.client} onChange={e => set("client", e.target.value)}
            placeholder={o.clientPlaceholder[lang]} onFocus={fo} onBlur={bl} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{o.description[lang]}</label>
          <textarea style={{ ...fieldStyle, resize: "vertical", minHeight: 72 }}
            value={form.description ?? ""} onChange={e => set("description", e.target.value)}
            placeholder={o.descriptionPlaceholder[lang]} onFocus={fo} onBlur={bl} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>{o.statusLabel[lang]}</label>
            <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.status}
              onChange={e => set("status", e.target.value)} onFocus={fo} onBlur={bl}>
              {COLUMNS.map(s => <option key={s} value={s}>{statusEmojis[s]} {statusLabels[s]}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{o.source[lang]}</label>
            <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.source ?? ""}
              onChange={e => set("source", e.target.value)} onFocus={fo} onBlur={bl}>
              <option value="">{o.noSource[lang]}</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>{o.budget[lang]}</label>
            <input style={fieldStyle} value={form.budget ?? ""} onChange={e => set("budget", e.target.value)}
              placeholder={o.budgetPlaceholder[lang]} onFocus={fo} onBlur={bl} />
          </div>
          <div>
            <label style={labelStyle}>{o.deadline[lang]}</label>
            <input type="date" style={{ ...fieldStyle, colorScheme: "dark" }} value={form.deadline ?? ""}
              onChange={e => set("deadline", e.target.value)} onFocus={fo} onBlur={bl} />
          </div>
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{o.linkProject[lang]}</label>
          <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.project_id ?? ""}
            onChange={e => set("project_id", e.target.value)} onFocus={fo} onBlur={bl}>
            <option value="">{o.noLink[lang]}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{o.notes[lang]}</label>
          <textarea style={{ ...fieldStyle, resize: "vertical", minHeight: 60 }}
            value={form.notes ?? ""} onChange={e => set("notes", e.target.value)}
            placeholder={o.notesPlaceholder[lang]} onFocus={fo} onBlur={bl} />
        </div>
        <SubmitButton label={initial ? o.saveBtn[lang] : o.addOrderBtn[lang]} />
      </form>
    </Modal>
  )
}

// ─── Deadline Chip ────────────────────────────────────────────────────────────

function DeadlineChip({ deadline }: { deadline: string }) {
  const { lang } = useLang()
  const date = new Date(deadline)
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const color = diff < 0 ? "#EF4444" : diff <= 7 ? "#F59E0B" : "var(--text-muted)"
  const icon = diff < 0 ? "🔴" : diff <= 7 ? "🟡" : "📅"
  const dayLabel = diff < 0 ? `−${Math.abs(diff)}d` : diff === 0 ? t.ordersPage.today[lang] : `${diff}d`
  const locale = lang === "en" ? "en-US" : "ru-RU"
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, display: "flex", alignItems: "center", gap: 3 }}>
      {icon} {date.toLocaleDateString(locale, { day: "numeric", month: "short" })} · {dayLabel}
    </span>
  )
}

// ─── Card Content ─────────────────────────────────────────────────────────────

function CardContent({ order, color, projects, dragHandleProps, isOverlay, onDelete, onOpen }: {
  order: DBOrder
  color: string
  projects: DBProject[]
  dragHandleProps?: Record<string, unknown>
  isOverlay?: boolean
  onDelete?: () => void
  onOpen?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const linkedProject = order.project_id ? projects.find(p => p.id === order.project_id) : null

  return (
    <div
      onClick={!isOverlay ? onOpen : undefined}
      style={{
        background: isOverlay ? "var(--bg-elevated)" : "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: isOverlay ? "0 8px 24px rgba(0,0,0,0.5)" : "none",
        cursor: isOverlay ? "grabbing" : onOpen ? "pointer" : "default",
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {onDelete && hovered && !isOverlay && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            position: "absolute", top: 10, right: 10,
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "3px 6px", cursor: "pointer",
            color: "var(--danger)", lineHeight: 1, zIndex: 1,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"}
        >
          <Trash2 size={12} />
        </button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: onDelete ? 24 : 0 }}>
        <div
          {...dragHandleProps}
          onClick={e => e.stopPropagation()}
          style={{ cursor: "grab", color: "var(--text-muted)", flexShrink: 0, opacity: 0.5, transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.5"}
        >
          <GripVertical size={14} />
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, flex: 1 }}>{order.client}</span>
        {order.source && (
          <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            {order.source}
          </span>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
        {order.title}
      </div>

      {order.description && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {order.description}
        </div>
      )}

      {(order.budget || order.deadline) && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {order.budget && <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>{order.budget}</span>}
          {order.deadline && <DeadlineChip deadline={order.deadline} />}
        </div>
      )}

      {linkedProject && (
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.12)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.25)", alignSelf: "flex-start" }}>
          🔗 {linkedProject.title}
        </span>
      )}

      {order.notes && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.45, padding: "7px 9px", borderRadius: 7, background: `${color}10`, border: `1px solid ${color}25` }}>
          {order.notes}
        </div>
      )}
    </div>
  )
}

function DraggableCard({ order, projects, isDragging, onDelete, onOpen }: {
  order: DBOrder
  projects: DBProject[]
  isDragging?: boolean
  onDelete?: () => void
  onOpen?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: order.id })
  const color = statusColor[order.status]

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }}>
      <CardContent order={order} color={color} projects={projects} dragHandleProps={{ ...attributes, ...listeners }} onDelete={onDelete} onOpen={onOpen} />
    </div>
  )
}

function DroppableColumn({ status, orders, projects, activeId, onDelete, onOpen }: {
  status: OrderStatus
  orders: DBOrder[]
  projects: DBProject[]
  activeId: string | null
  onDelete: (id: string) => void
  onOpen: (o: DBOrder) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const { lang } = useLang()
  const color = statusColor[status]
  const statusLabels: Record<OrderStatus, string> = {
    new: t.ordersPage.new[lang], discussion: t.ordersPage.discussion[lang],
    in_progress: t.ordersPage.inProgressStatus[lang], done: t.ordersPage.done[lang], invoiced: t.ordersPage.invoiced[lang],
  }
  const statusEmojis: Record<OrderStatus, string> = { new: "🆕", discussion: "💬", in_progress: "🔨", done: "✅", invoiced: "🧾" }

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: `${color}12`, border: `1px solid ${color}25` }}>
        <span style={{ fontSize: 13 }}>{statusEmojis[status]}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.2px" }}>{statusLabels[status]}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: 10 }}>
          {orders.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 80, borderRadius: 10, padding: 4, border: isOver ? `2px dashed ${color}` : "2px solid transparent", background: isOver ? `${color}08` : "transparent", transition: "all 0.15s" }}>
        {orders.map(order => (
          <DraggableCard
            key={order.id}
            order={order}
            projects={projects}
            isDragging={order.id === activeId}
            onDelete={() => onDelete(order.id)}
            onOpen={() => onOpen(order)}
          />
        ))}
        {orders.length === 0 && !isOver && (
          <div style={{ padding: "20px 14px", borderRadius: 10, border: "1px dashed var(--border)", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
            {t.ordersPage.dragHere[lang]}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<DBOrder[]>([])
  const [projects, setProjects] = useState<DBProject[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editOrder, setEditOrder] = useState<DBOrder | null>(null)
  const [detailOrder, setDetailOrder] = useState<DBOrder | null>(null)
  const { lang } = useLang()
  const o = t.ordersPage
  const statusLabels: Record<OrderStatus, string> = {
    new: o.new[lang], discussion: o.discussion[lang],
    in_progress: o.inProgressStatus[lang], done: o.done[lang], invoiced: o.invoiced[lang],
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([ordersData, projectsData]) => {
      setOrders(ordersData || [])
      setProjects((projectsData || []).filter((p: DBProject & { archived: boolean }) => !p.archived))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const activeOrder = orders.find(o => o.id === activeId) ?? null

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const newStatus = over.id as OrderStatus
    if (!COLUMNS.includes(newStatus)) return
    const prev = orders.find(o => o.id === active.id)
    if (!prev || prev.status === newStatus) return

    setOrders(os => os.map(o => o.id === active.id ? { ...o, status: newStatus } : o))
    await fetch(`/api/orders?id=${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    logHistory({ action: "moved", itemType: "order", itemTitle: prev.title, from: statusLabels[prev.status], to: statusLabels[newStatus] })
  }

  async function handleAdd(data: Partial<DBOrder>) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.order) {
      setOrders(os => [json.order, ...os])
      logHistory({ action: "added", itemType: "order", itemTitle: json.order.title, to: statusLabels[json.order.status as OrderStatus] })
    }
  }

  async function handleEdit(data: Partial<DBOrder>) {
    if (!editOrder) return
    setOrders(os => os.map(o => o.id === editOrder.id ? { ...o, ...data } : o))
    await fetch(`/api/orders?id=${editOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async function handleDelete(id: string) {
    const order = orders.find(o => o.id === id)
    setOrders(os => os.filter(o => o.id !== id))
    await fetch(`/api/orders?id=${id}`, { method: 'DELETE' })
    if (order) logHistory({ action: "deleted", itemType: "order", itemTitle: order.title })
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--text-muted)", fontSize: 13 }}>
      {o.loading[lang]}
    </div>
  )

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
            {o.title[lang]}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
            {orders.length} {o.subtitle[lang]}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
        >
          <Plus size={14} /> {o.newOrder[lang]}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <MetricCard emoji="🔨" value={orders.filter(ord => ord.status === "in_progress").length} label={o.inProgress[lang]} color="#3B82F6" />
        <MetricCard emoji="✅" value={orders.filter(ord => ord.status === "done" || ord.status === "invoiced").length} label={o.completed[lang]} color="#22C55E" />
        <MetricCard emoji="📋" value={orders.length} label={o.total[lang]} color="var(--text-secondary)" />
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {COLUMNS.map(status => (
            <DroppableColumn
              key={status}
              status={status}
              orders={orders.filter(o => o.status === status)}
              projects={projects}
              activeId={activeId}
              onDelete={handleDelete}
              onOpen={setDetailOrder}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder && (
            <CardContent order={activeOrder} color={statusColor[activeOrder.status]} projects={projects} isOverlay />
          )}
        </DragOverlay>
      </DndContext>

      {showModal && <OrderFormModal projects={projects} onSave={handleAdd} onClose={() => setShowModal(false)} />}
      {editOrder && (
        <OrderFormModal
          initial={editOrder}
          projects={projects}
          onSave={data => { handleEdit(data); setEditOrder(null) }}
          onClose={() => setEditOrder(null)}
        />
      )}
      {detailOrder && (
        <div
          onClick={() => setDetailOrder(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, maxWidth: 480, width: "90%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{detailOrder.client} · {detailOrder.source}</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 12px" }}>{detailOrder.title}</h2>
            {detailOrder.description && <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>{detailOrder.description}</p>}
            {detailOrder.budget && <div style={{ fontSize: 13, color: "#22C55E", fontWeight: 600, marginBottom: 8 }}>💰 {detailOrder.budget}</div>}
            {detailOrder.notes && <div style={{ fontSize: 13, color: "var(--text-secondary)", padding: "10px 14px", borderRadius: 8, background: "var(--bg-elevated)", marginBottom: 16 }}>{detailOrder.notes}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setEditOrder(detailOrder); setDetailOrder(null) }}
                style={{ flex: 1, padding: "8px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                {o.editBtn[lang]}
              </button>
              <button onClick={() => setDetailOrder(null)}
                style={{ padding: "8px 14px", background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                {o.closeBtn[lang]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
