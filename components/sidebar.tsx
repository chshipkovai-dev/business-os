"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { LayoutGrid, TrendingUp, Lightbulb, FileText, Brain, Code2, Star } from "lucide-react"
import { useEffect, useState, Suspense } from "react"
import { initialProjects, stageLabel, stageColor } from "@/lib/projects"

const STARRED_KEY = "business_os_starred"

const globalNav = [
  { href: "/", label: "Все проекты", icon: LayoutGrid },
  { href: "/trends", label: "Тренды", icon: TrendingUp },
  { href: "/ideas", label: "Идеи", icon: Lightbulb },
]

const projectTabs = [
  { tab: "overview", label: "Обзор", icon: LayoutGrid },
  { tab: "plan", label: "Бизнес план", icon: FileText },
  { tab: "advisor", label: "AI Советник", icon: Brain },
  { tab: "dev", label: "Разработка", icon: Code2 },
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
  const searchParams = useSearchParams()
  const [starredId, setStarredId] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STARRED_KEY)
    setStarredId(saved || "amazon-listing-ai")

    const onStorage = () => {
      const s = localStorage.getItem(STARRED_KEY)
      setStarredId(s || "amazon-listing-ai")
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // Re-read starred from localStorage when pathname changes (e.g. after starring)
  useEffect(() => {
    const s = localStorage.getItem(STARRED_KEY)
    setStarredId(s || "amazon-listing-ai")
  }, [pathname])

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  const currentProjectId = projectMatch?.[1] ?? null
  const currentTab = searchParams.get("tab") || "overview"
  const starred = initialProjects.find(p => p.id === starredId)
  const isInProject = !!currentProjectId

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
          Business OS
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Личное пространство
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

        {/* Active (starred) project */}
        {starred && (
          <>
            <div style={{ height: 1, background: "var(--border)", margin: "12px 0 10px" }} />
            <div style={{ padding: "0 10px 4px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 8 }}>
                ⭐ В работе
              </div>

              {/* Project name link */}
              <Link href={`/projects/${starred.id}`} style={{
                display: "block", padding: "7px 10px", borderRadius: 7,
                textDecoration: "none", marginBottom: 2,
                background: currentProjectId === starred.id && !searchParams.get("tab") ? "rgba(99,102,241,0.1)" : "transparent",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--bg-elevated)" }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = currentProjectId === starred.id && !searchParams.get("tab") ? "rgba(99,102,241,0.1)" : "transparent"
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.35, marginBottom: 3 }}>
                  {starred.title}
                </div>
                <span style={{
                  fontSize: 10, padding: "1px 6px", borderRadius: 4, display: "inline-block",
                  background: stageColor[starred.stage] + "20", color: stageColor[starred.stage],
                }}>
                  {stageLabel[starred.stage]}
                </span>
              </Link>

              {/* Project sub-tabs — always visible when project is starred */}
              <div style={{ paddingLeft: 8, display: "flex", flexDirection: "column", gap: 1, marginTop: 4 }}>
                {projectTabs.map(({ tab, label, icon: Icon }) => {
                  const active = currentProjectId === starred.id && currentTab === tab
                  return (
                    <Link
                      key={tab}
                      href={`/projects/${starred.id}?tab=${tab}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                        borderRadius: 6, fontSize: 12, textDecoration: "none",
                        color: active ? "var(--accent)" : "var(--text-muted)",
                        background: active ? "rgba(99,102,241,0.08)" : "transparent",
                        fontWeight: active ? 500 : 400,
                        transition: "all 0.15s",
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
            </div>
          </>
        )}

        {/* If browsing a different (non-starred) project */}
        {isInProject && currentProjectId !== starredId && (() => {
          const proj = initialProjects.find(p => p.id === currentProjectId)
          if (!proj) return null
          return (
            <>
              <div style={{ height: 1, background: "var(--border)", margin: "8px 0 10px" }} />
              <div style={{ padding: "0 10px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 8 }}>
                  Открыт
                </div>
                <div style={{ padding: "7px 10px", borderRadius: 7, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", lineHeight: 1.35 }}>{proj.title}</div>
                </div>
                <div style={{ paddingLeft: 8, display: "flex", flexDirection: "column", gap: 1 }}>
                  {projectTabs.map(({ tab, label, icon: Icon }) => {
                    const active = currentTab === tab
                    return (
                      <Link key={tab} href={`/projects/${currentProjectId}?tab=${tab}`} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                        borderRadius: 6, fontSize: 12, textDecoration: "none",
                        color: active ? "var(--accent)" : "var(--text-muted)",
                        background: active ? "rgba(99,102,241,0.08)" : "transparent",
                        fontWeight: active ? 500 : 400, transition: "all 0.15s",
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
              </div>
            </>
          )
        })()}
      </nav>

      {/* Bottom */}
      <div style={{ paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        <div style={{ padding: "4px 10px", fontSize: 11, color: "var(--text-muted)" }}>
          v0.1 · {initialProjects.length} проектов
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
