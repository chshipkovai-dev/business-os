"use client"

import { useState, useEffect } from "react"
import { DndContext, DragOverlay, useDroppable, useDraggable, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import {
  orders as initialOrders,
  statusLabel,
  statusColor,
  statusEmoji,
  type Order,
  type OrderStatus,
} from "@/lib/orders"

const ORDERS_KEY = "ailnex_order_statuses"
const COLUMNS: OrderStatus[] = ["new", "discussion", "in_progress", "done", "invoiced"]

function loadStatuses(): Record<string, OrderStatus> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStatuses(statuses: Record<string, OrderStatus>) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(statuses))
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CardContent({
  order,
  color,
  dragHandleProps,
  isOverlay,
}: {
  order: Order
  color: string
  dragHandleProps?: Record<string, unknown>
  isOverlay?: boolean
}) {
  return (
    <div style={{
      background: isOverlay ? "var(--bg-elevated)" : "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      boxShadow: isOverlay ? "0 8px 24px rgba(0,0,0,0.5)" : "none",
      cursor: isOverlay ? "grabbing" : "default",
    }}>
      {/* Client + source */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          {...dragHandleProps}
          style={{
            cursor: "grab", color: "var(--text-muted)", flexShrink: 0,
            opacity: 0.5, transition: "opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.5"}
        >
          <GripVertical size={14} />
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, flex: 1 }}>
          {order.client}
        </span>
        {order.source && (
          <span style={{
            fontSize: 10, padding: "1px 7px", borderRadius: 20,
            background: "var(--bg-elevated)", color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}>{order.source}</span>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
        {order.title}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {order.description}
      </div>

      {/* Budget */}
      {order.budget && (
        <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>
          {order.budget}
        </span>
      )}

      {/* Notes */}
      {order.notes && (
        <div style={{
          fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.45,
          padding: "7px 9px", borderRadius: 7,
          background: `${color}10`, border: `1px solid ${color}25`,
        }}>
          {order.notes}
        </div>
      )}
    </div>
  )
}

function DraggableCard({ order, isDragging }: { order: Order; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: order.id })
  const color = statusColor[order.status]

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }}>
      <CardContent order={order} color={color} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function DroppableColumn({
  status,
  orders,
  activeId,
}: {
  status: OrderStatus
  orders: Order[]
  activeId: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const color = statusColor[status]

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", borderRadius: 8,
        background: `${color}12`, border: `1px solid ${color}25`,
      }}>
        <span style={{ fontSize: 13 }}>{statusEmoji[status]}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.2px" }}>
          {statusLabel[status]}
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 600,
          color: "var(--text-muted)", background: "var(--bg-elevated)",
          padding: "1px 6px", borderRadius: 10,
        }}>
          {orders.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          display: "flex", flexDirection: "column", gap: 8,
          minHeight: 80, borderRadius: 10, padding: 4,
          border: isOver ? `2px dashed ${color}` : "2px solid transparent",
          background: isOver ? `${color}08` : "transparent",
          transition: "all 0.15s",
        }}
      >
        {orders.map(order => (
          <DraggableCard key={order.id} order={order} isDragging={order.id === activeId} />
        ))}
        {orders.length === 0 && !isOver && (
          <div style={{
            padding: "20px 14px", borderRadius: 10,
            border: "1px dashed var(--border)",
            textAlign: "center", fontSize: 12, color: "var(--text-muted)",
          }}>
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
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setStatusOverrides(loadStatuses())
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const allOrders = initialOrders.map(o => ({
    ...o,
    status: (statusOverrides[o.id] ?? o.status) as OrderStatus,
  }))

  const activeOrder = allOrders.find(o => o.id === activeId) ?? null

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const newStatus = over.id as OrderStatus
    if (!COLUMNS.includes(newStatus)) return
    const updated = { ...statusOverrides, [active.id]: newStatus }
    setStatusOverrides(updated)
    saveStatuses(updated)
  }

  if (!mounted) return null

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 600,
          color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px",
        }}>
          Заказы
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
          {allOrders.length} заказов · перетащи карточку чтобы изменить статус
        </p>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {COLUMNS.map(status => (
            <DroppableColumn
              key={status}
              status={status}
              orders={allOrders.filter(o => o.status === status)}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder && (
            <CardContent
              order={activeOrder}
              color={statusColor[activeOrder.status]}
              isOverlay
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
