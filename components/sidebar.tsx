"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, ShoppingBag, Lightbulb, Archive, ChevronDown, ChevronRight, FolderOpen, TrendingUp, Sun, Moon, Clock, CheckSquare, Target, Users } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useLang } from "@/lib/lang"
import { t } from "@/lib/translations"

const THEME_KEY = "ailnex_theme"

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
      borderRadius: 8, fontSize: 12, fontWeight: active ? 600 : 400,
      color: active ? "var(--accent)" : "var(--text-secondary)",
      background: active ? "var(--accent-dim)" : "transparent",
      border: active ? "1px solid rgba(0,229,255,0.15)" : "1px solid transparent",
      textDecoration: "none", transition: "all 0.15s",
      letterSpacing: active ? "0.2px" : "0",
    }}
      onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "var(--bg-elevated)"; el.style.color = "var(--text-primary)"; el.style.borderColor = "var(--border)" } }}
      onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-secondary)"; el.style.borderColor = "transparent" } }}
    >
      <Icon size={13} />
      {label}
    </Link>
  )
}

function SidebarInner() {
  const pathname = usePathname()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const { lang, setLang } = useLang()
  const s = t.sidebar

  const globalNav = [
    { href: "/", label: s.board[lang], icon: LayoutGrid },
    { href: "/orders", label: s.orders[lang], icon: ShoppingBag },
    { href: "/planner", label: s.planner[lang], icon: CheckSquare },
    { href: "/niches", label: s.niches[lang], icon: Target },
    { href: "/team", label: "AI Team", icon: Users },
  ]

  const archiveLinks = [
    { href: "/archived-projects", label: s.archivedProjects[lang], icon: Archive },
    { href: "/history", label: s.history[lang], icon: Clock },
    { href: "/ideas", label: s.scoutIdeas[lang], icon: Lightbulb },
    { href: "/all-projects", label: s.allIdeas[lang], icon: FolderOpen },
    { href: "/trends", label: s.trends[lang], icon: TrendingUp },
  ]

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) || "dark") as "dark" | "light"
    setTheme(saved)
    document.documentElement.setAttribute("data-theme", saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem(THEME_KEY, next)
    document.documentElement.setAttribute("data-theme", next)
  }

  return (
    <aside style={{
      width: 220, minHeight: "100vh",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      padding: "24px 12px",
      display: "flex", flexDirection: "column",
      flexShrink: 0,
      position: "relative",
    }}>
      {/* Subtle top glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, var(--accent-glow), transparent)",
      }} />

      {/* Brand */}
      <div style={{ padding: "4px 12px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 26, height: 26,
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#000",
            fontFamily: "var(--font-display)",
            boxShadow: "0 0 12px var(--accent-glow)",
            flexShrink: 0,
          }}>ai</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px", fontFamily: "var(--font-display)" }}>
            {s.brand[lang]}
          </div>
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "1.5px", textTransform: "uppercase", paddingLeft: 34 }}>
          {s.subtitle[lang]}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--border), transparent)", marginBottom: 12 }} />

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {globalNav.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} active={pathname === href} />
        ))}

        {/* Archive section */}
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 10 }} />
          <button
            onClick={() => setArchiveOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "8px 12px", borderRadius: 8,
              background: "transparent", border: "1px solid transparent", cursor: "pointer",
              fontSize: 12, color: "var(--text-muted)", transition: "all 0.15s",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--bg-elevated)"; el.style.color = "var(--text-secondary)"; el.style.borderColor = "var(--border)" }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-muted)"; el.style.borderColor = "transparent" }}
          >
            <Archive size={13} />
            <span style={{ flex: 1, textAlign: "left" }}>{s.archive[lang]}</span>
            {archiveOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>

          {archiveOpen && (
            <div style={{ paddingLeft: 10, marginTop: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              {archiveLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link key={href} href={href} style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "6px 12px", borderRadius: 7, fontSize: 11,
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    background: active ? "var(--accent-dim)" : "transparent",
                    border: active ? "1px solid rgba(0,229,255,0.12)" : "1px solid transparent",
                    fontWeight: active ? 500 : 400,
                    textDecoration: "none", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "var(--bg-elevated)"; el.style.color = "var(--text-secondary)" } }}
                    onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-muted)" } }}
                  >
                    <Icon size={12} />
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--border), transparent)", marginBottom: 12 }} />
      <div style={{ padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "1px", fontFamily: "var(--font-mono)" }}>v0.3</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
            style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: 5, padding: "2px 7px", cursor: "pointer",
              fontSize: 10, fontWeight: 600, color: "var(--text-secondary)",
              letterSpacing: "0.5px", transition: "all 0.15s",
              fontFamily: "var(--font-mono)",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--accent)"; el.style.color = "var(--accent)" }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-secondary)" }}
          >
            {lang === "ru" ? "EN" : "RU"}
          </button>
          <button
            onClick={toggleTheme}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6, lineHeight: 1, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function Sidebar() {
  return (
    <Suspense fallback={<aside style={{ width: 220, minHeight: "100vh", background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }} />}>
      <SidebarInner />
    </Suspense>
  )
}
