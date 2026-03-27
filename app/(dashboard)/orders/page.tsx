"use client"

import { useState, useEffect } from "react"
import { DndContext, DragOverlay, useDroppable, useDraggable, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import {
  orders as initialOrders,
  statusLabel,
  statusColor,
  statusEmoji,
  type Order,
  type OrderStatus,
} from "@/lib/orders"
import { companyProjects } from "@/lib/company-projects"
import { Modal, fieldStyle, labelStyle, fieldGroupStyle, SubmitButton } from "@/components/modal"
import { OrderDetailPanel } from "@/components/detail-panel"
import { MetricCard } from "@/components/metric-card"
import { logHistory } from "@/lib/history"

const ORDERS_KEY = "ailnex_order_statuses"
const CUSTOM_ORDERS_KEY = "ailnex_custom_orders"
const COLUMNS: OrderStatus[] = ["new", "discussion", "in_progress", "done", "invoiced"]
const SOURCES = ["Upwork", "Referral", "Ailnex", "Direct", "Другое"]

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

function loadStatuses(): Record<string, OrderStatus> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || "{}") } catch { return {} }
}

function loadCustomOrders(): Order[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(CUSTOM_ORDERS_KEY) || "[]") } catch { return [] }
}

function saveStatuses(s: Record<string, OrderStatus>) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(s))
}

function saveCustomOrders(o: Order[]) {
  localStorage.setItem(CUSTOM_ORDERS_KEY, JSON.stringify(o))
}

// ─── Add Order Modal ──────────────────────────────────────────────────────────

function AddOrderModal({ onAdd, onClose }: {
  onAdd: (o: Order) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    client: "", title: "", description: "",
    status: "new" as OrderStatus,
    source: "", budget: "", deadline: "", notes: "", projectId: "",
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onAdd({
      id: `custom-${Date.now()}`,
      client: form.client.trim() || "—",
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      source: form.source || undefined,
      budget: form.budget.trim() || undefined,
      deadline: form.deadline || undefined,
      notes: form.notes.trim() || undefined,
      projectId: form.projectId || undefined,
    })
    onClose()
  }

  return (
    <Modal title="Новый заказ" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Название *</label>
          <input style={fieldStyle} value={form.title} onChange={e => set("title", e.target.value)}
            placeholder="Название заказа" autoFocus
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Клиент</label>
          <input style={fieldStyle} value={form.client} onChange={e => set("client", e.target.value)}
            placeholder="Имя клиента или компании"
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Описание</label>
          <textarea style={{ ...fieldStyle, resize: "vertical", minHeight: 72 }}
            value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Что нужно сделать?"
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Статус</label>
            <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.status}
              onChange={e => set("status", e.target.value)}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}>
              {COLUMNS.map(s => <option key={s} value={s}>{statusEmoji[s]} {statusLabel[s]}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Источник</label>
            <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.source}
              onChange={e => set("source", e.target.value)}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}>
              <option value="">— не указан</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Бюджет</label>
            <input style={fieldStyle} value={form.budget} onChange={e => set("budget", e.target.value)}
              placeholder="50k CZK, $500, ..."
              onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
          </div>
          <div>
            <label style={labelStyle}>Дедлайн</label>
            <input type="date" style={{ ...fieldStyle, colorScheme: "dark" }} value={form.deadline}
              onChange={e => set("deadline", e.target.value)}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
          </div>
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Связать с проектом</label>
          <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.projectId}
            onChange={e => set("projectId", e.target.value)}
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}>
            <option value="">— не связан</option>
            {companyProjects.filter(p => !p.archived).map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Заметки</label>
          <textarea style={{ ...fieldStyle, resize: "vertical", minHeight: 60 }}
            value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Важные детали, следующие шаги..."
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
        </div>
        <SubmitButton label="Добавить заказ" />
      </form>
    </Modal>
  )
}

// ─── Deadline Chip ────────────────────────────────────────────────────────────

function DeadlineChip({ deadline }: { deadline: string }) {
  const date = new Date(deadline)
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const color = diff < 0 ? "#EF4444" : diff <= 7 ? "#F59E0B" : "var(--text-muted)"
  const icon = diff < 0 ? "🔴" : diff <= 7 ? "🟡" : "📅"
  const label = diff < 0 ? `−${Math.abs(diff)}д` : diff === 0 ? "Сегодня" : `${diff}д`
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, display: "flex", alignItems: "center", gap: 3 }}>
      {icon} {date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} · {label}
    </span>
  )
}

// ─── Card Content ─────────────────────────────────────────────────────────────

function CardContent({
  order,
  color,
  dragHandleProps,
  isOverlay,
  onDelete,
  onOpen,
}: {
  order: Order
  color: string
  dragHandleProps?: Record<string, unknown>
  isOverlay?: boolean
  onDelete?: () => void
  onOpen?: () => void
}) {
  const [hovered, setHovered] = useState(false)

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

      {/* Client + source */}
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
          {order.budget && (
            <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>{order.budget}</span>
          )}
          {order.deadline && <DeadlineChip deadline={order.deadline} />}
        </div>
      )}

      {order.projectId && (() => {
        const proj = companyProjects.find(p => p.id === order.projectId)
        return proj ? (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.12)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.25)", alignSelf: "flex-start" }}>
            🔗 {proj.title}
          </span>
        ) : null
      })()}

      {order.notes && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.45, padding: "7px 9px", borderRadius: 7, background: `${color}10`, border: `1px solid ${color}25` }}>
          {order.notes}
        </div>
      )}
    </div>
  )
}

function DraggableCard({ order, isDragging, onDelete, onOpen }: {
  order: Order
  isDragging?: boolean
  onDelete?: () => void
  onOpen?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: order.id })
  const color = statusColor[order.status]

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }}>
      <CardContent order={order} color={color} dragHandleProps={{ ...attributes, ...listeners }} onDelete={onDelete} onOpen={onOpen} />
    </div>
  )
}

function DroppableColumn({ status, orders, activeId, onDelete, onOpen }: {
  status: OrderStatus
  orders: Order[]
  activeId: string | null
  onDelete: (id: string) => void
  onOpen: (o: Order) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const color = statusColor[status]

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: `${color}12`, border: `1px solid ${color}25` }}>
        <span style={{ fontSize: 13 }}>{statusEmoji[status]}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.2px" }}>{statusLabel[status]}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: 10 }}>
          {orders.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 80, borderRadius: 10, padding: 4, border: isOver ? `2px dashed ${color}` : "2px solid transparent", background: isOver ? `${color}08` : "transparent", transition: "all 0.15s" }}>
        {orders.map(order => (
          <DraggableCard
            key={order.id}
            order={order}
            isDragging={order.id === activeId}
            onDelete={order.id.startsWith("custom-") ? () => onDelete(order.id) : undefined}
            onOpen={() => onOpen(order)}
          />
        ))}
        {orders.length === 0 && !isOver && (
          <div style={{ padding: "20px 14px", borderRadius: 10, border: "1px dashed var(--border)", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
            Перетащи сюда
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, OrderStatus>>({})
  const [customOrders, setCustomOrders] = useState<Order[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setStatusOverrides(loadStatuses())
    setCustomOrders(loadCustomOrders())
    setMounted(true)
  }, [])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const allOrders = [...initialOrders, ...customOrders].map(o => ({
    ...o,
    status: (statusOverrides[o.id] ?? o.status) as OrderStatus,
  }))

  const activeOrder = allOrders.find(o => o.id === activeId) ?? null

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const newStatus = over.id as OrderStatus
    if (!COLUMNS.includes(newStatus)) return
    const prev = allOrders.find(o => o.id === active.id)
    const updated = { ...statusOverrides, [active.id]: newStatus }
    setStatusOverrides(updated)
    saveStatuses(updated)
    if (prev && prev.status !== newStatus) {
      logHistory({ action: "moved", itemType: "order", itemTitle: prev.title, from: statusLabel[prev.status], to: statusLabel[newStatus] })
    }
  }

  function handleAdd(o: Order) {
    const updated = [...customOrders, o]
    setCustomOrders(updated)
    saveCustomOrders(updated)
    logHistory({ action: "added", itemType: "order", itemTitle: o.title, to: statusLabel[o.status] })
  }

  function handleDelete(id: string) {
    const order = customOrders.find(o => o.id === id)
    const updated = customOrders.filter(o => o.id !== id)
    setCustomOrders(updated)
    saveCustomOrders(updated)
    const overrides = { ...statusOverrides }
    delete overrides[id]
    setStatusOverrides(overrides)
    saveStatuses(overrides)
    if (order) logHistory({ action: "deleted", itemType: "order", itemTitle: order.title })
  }

  if (!mounted) return null

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
            Заказы
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
            {allOrders.length} заказов · перетащи карточку чтобы изменить статус
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
        >
          <Plus size={14} /> Заказ
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <MetricCard emoji="🔨" value={allOrders.filter(o => o.status === "in_progress").length} label="В работе" color="#3B82F6" />
        <MetricCard emoji="✅" value={allOrders.filter(o => o.status === "done" || o.status === "invoiced").length} label="Завершено" color="#22C55E" />
        <MetricCard emoji="📋" value={allOrders.length} label="Всего заказов" color="var(--text-secondary)" />
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {COLUMNS.map(status => (
            <DroppableColumn
              key={status}
              status={status}
              orders={allOrders.filter(o => o.status === status)}
              activeId={activeId}
              onDelete={handleDelete}
              onOpen={setDetailOrder}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder && (
            <CardContent order={activeOrder} color={statusColor[activeOrder.status]} isOverlay />
          )}
        </DragOverlay>
      </DndContext>

      {showModal && <AddOrderModal onAdd={handleAdd} onClose={() => setShowModal(false)} />}
      {detailOrder && <OrderDetailPanel order={detailOrder} onClose={() => setDetailOrder(null)} />}
    </div>
  )
}
