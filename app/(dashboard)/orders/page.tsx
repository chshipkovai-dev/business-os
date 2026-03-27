"use client"

import {
  orders,
  statusLabel,
  statusColor,
  statusEmoji,
  type Order,
  type OrderStatus,
} from "@/lib/orders"

const columns: OrderStatus[] = ["new", "discussion", "in_progress", "done", "invoiced"]

function OrderCard({ order }: { order: Order }) {
  const color = statusColor[order.status]

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "all 0.15s",
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = "var(--bg-elevated)"
        el.style.borderColor = color
        el.style.borderLeftColor = color
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = "var(--bg-surface)"
        el.style.borderColor = "var(--border)"
        el.style.borderLeftColor = color
      }}
    >
      {/* Client + source */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
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
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
        {order.title}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {order.description}
      </div>

      {/* Budget + deadline */}
      {(order.budget || order.deadline) && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {order.budget && (
            <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>
              {order.budget}
            </span>
          )}
          {order.deadline && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              📅 {order.deadline}
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div style={{
          fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.45,
          padding: "7px 10px", borderRadius: 7,
          background: `${color}10`, border: `1px solid ${color}25`,
        }}>
          {order.notes}
        </div>
      )}
    </div>
  )
}

function OrderColumn({ status }: { status: OrderStatus }) {
  const color = statusColor[status]
  const emoji = statusEmoji[status]
  const label = statusLabel[status]
  const items = orders.filter(o => o.status === status)

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Column header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", borderRadius: 8,
        background: `${color}12`, border: `1px solid ${color}25`,
      }}>
        <span style={{ fontSize: 13 }}>{emoji}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.2px" }}>
          {label}
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 600,
          color: "var(--text-muted)", background: "var(--bg-elevated)",
          padding: "1px 6px", borderRadius: 10,
        }}>
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
        {items.length === 0 && (
          <div style={{
            padding: "20px 14px", borderRadius: 10,
            border: "1px dashed var(--border)",
            textAlign: "center", fontSize: 12, color: "var(--text-muted)",
          }}>
            Нет заказов
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 600,
          color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px",
        }}>
          Заказы
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
          {orders.length} заказов · фриланс и клиенты Ailnex
        </p>
      </div>

      {/* Kanban */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {columns.map(status => (
          <OrderColumn key={status} status={status} />
        ))}
      </div>
    </div>
  )
}
