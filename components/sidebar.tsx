"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, ShoppingBag, Lightbulb, Archive, ChevronDown, ChevronRight, FolderOpen, TrendingUp, Sun, Moon, Clock, CheckSquare, Target } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useLang } from "@/lib/lang"
import { t } from "@/lib/translations"

const THEME_KEY = "ailnex_theme"

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
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const { lang, setLang } = useLang()

  const s = t.sidebar

  const globalNav = [
    { href: "/", label: s.board[lang], icon: LayoutGrid },
    { href: "/orders", label: s.orders[lang], icon: ShoppingBag },
    { href: "/planner", label: s.planner[lang], icon: CheckSquare },
    { href: "/niches", label: s.niches[lang], icon: Target },
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
          {s.brand[lang]}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {s.subtitle[lang]}
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {globalNav.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} active={pathname === href} />
        ))}

        {/* Archive section */}
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 10 }} />

          <button
            onClick={() => setArchiveOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              width: "100%", padding: "7px 10px", borderRadius: 7,
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--text-muted)", transition: "all 0.15s",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--bg-elevated)"; el.style.color = "var(--text-secondary)" }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "var(--text-muted)" }}
          >
            <Archive size={14} />
            <span style={{ flex: 1, textAlign: "left" }}>{s.archive[lang]}</span>
            {archiveOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

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
      <div style={{ paddingTop: 8, borderTop: "1px solid var(--border)", padding: "8px 10px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>v0.2</span>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
            title={lang === "ru" ? "Switch to English" : "Переключить на русский"}
            style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: 6, padding: "3px 7px", cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
              lineHeight: 1.4, transition: "all 0.15s", letterSpacing: "0.3px",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--accent)"; el.style.color = "var(--accent)" }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-secondary)" }}
          >
            {lang === "ru" ? "EN" : "RU"}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? s.lightTheme[lang] : s.darkTheme[lang]}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6, lineHeight: 1, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
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
