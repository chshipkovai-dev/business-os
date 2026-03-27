"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, ShoppingBag, Lightbulb, Archive, ChevronDown, ChevronRight, FolderOpen, TrendingUp } from "lucide-react"
import { useState, Suspense } from "react"

const globalNav = [
  { href: "/", label: "Доска проектов", icon: LayoutGrid },
  { href: "/orders", label: "Заказы", icon: ShoppingBag },
]

const archiveLinks = [
  { href: "/ideas", label: "Идеи скаута", icon: Lightbulb },
  { href: "/all-projects", label: "Все проекты", icon: FolderOpen },
  { href: "/trends", label: "Тренды", icon: TrendingUp },
]

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 9, padding: "7px 10px",
      borderRadius: 7, fontSize: 13, fontWeight: active ? 500 : 400,
      color: active ? "var(--accent)" : "var(--text-secondary)",
      background: active ? "rgba(99,102,241,0.1)" : "transparent",
      textDecoration: "none", transition: "all 0.15s",
    }}
      onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "var(--bg-elevated)"; el.style.color = "var(--text-primary)" } }}
      onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-secondary)" } }}
    >
      <Icon size={14} />
      {label}
    </Link>
  )
}

function SidebarInner() {
  const pathname = usePathname()
  const [archiveOpen, setArchiveOpen] = useState(false)

  return (
    <aside style={{
      width: 210, minHeight: "100vh",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      padding: "20px 10px",
      display: "flex", flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: "4px 10px 20px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
          Ailnex OS
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Доска компании
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Global nav */}
        {globalNav.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href}
          />
        ))}

        {/* Archive section */}
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 10 }} />

          {/* Toggle button */}
          <button
            onClick={() => setArchiveOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              width: "100%", padding: "7px 10px", borderRadius: 7,
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--text-muted)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--bg-elevated)"; el.style.color = "var(--text-secondary)" }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-muted)" }}
          >
            <Archive size={14} />
            <span style={{ flex: 1, textAlign: "left" }}>Архив</span>
            {archiveOpen
              ? <ChevronDown size={12} />
              : <ChevronRight size={12} />
            }
          </button>

          {/* Archive links */}
          {archiveOpen && (
            <div style={{ paddingLeft: 8, marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
              {archiveLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link key={href} href={href} style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "6px 10px", borderRadius: 7, fontSize: 12,
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    background: active ? "rgba(99,102,241,0.08)" : "transparent",
                    fontWeight: active ? 500 : 400,
                    textDecoration: "none", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "var(--bg-elevated)"; el.style.color = "var(--text-secondary)" } }}
                    onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-muted)" } }}
                  >
                    <Icon size={13} />
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        <div style={{ padding: "4px 10px", fontSize: 11, color: "var(--text-muted)" }}>
          v0.2
        </div>
      </div>
    </aside>
  )
}

export default function Sidebar() {
  return (
    <Suspense fallback={<aside style={{ width: 210, minHeight: "100vh", background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }} />}>
      <SidebarInner />
    </Suspense>
  )
}
