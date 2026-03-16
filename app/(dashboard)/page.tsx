"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { stageLabel, stageColor, type Project } from "@/lib/projects"
import { Star, Plus, ArrowRight, Sparkles, Search } from "lucide-react"

const STARRED_KEY = "business_os_starred"
const STARRED_NONE = "__none__"

const tierColors: Record<string, string> = {
  S: "#6366F1",
  A: "#3B82F6",
  B: "#525472",
}

const scoreColor = (v: number) => v >= 8 ? "#22C55E" : v >= 6 ? "#F59E0B" : "#EF4444"

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value * 10}%`, height: "100%", background: scoreColor(value), borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color: "var(--text-secondary)", width: 14, textAlign: "right" }}>{value}</span>
    </div>
  )
}

function Tag({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 20,
      background: "var(--bg-elevated)", color: "var(--text-muted)",
      border: "1px solid var(--border)", letterSpacing: "0.2px",
    }}>{label}</span>
  )
}

export default function ProjectsBoard() {
  const router = useRouter()
  const [starredId, setStarredId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch('/api/ideas')
      .then(r => r.json())
      .then(data => {
        const mapped: Project[] = (Array.isArray(data) ? data : []).map((idea: {
          id: number; title: string; description: string; score: number; tier: string;
          market: number; mono: number; speed: number; competition: number;
          audience: string; tags: string[]; status: string;
        }) => ({
          id: String(idea.id),
          title: idea.title,
          description: idea.description,
          stage: idea.status === 'building' ? 'building' : idea.status === 'active' ? 'launched' : 'idea',
          score: idea.score,
          tier: idea.tier as 'S' | 'A' | 'B',
          market: idea.market,
          pain: idea.market,
          mono: idea.mono,
          speed: idea.speed,
          competition: idea.competition,
          audience: idea.audience || '',
          price: '',
          tags: idea.tags || [],
          competitors: [],
          createdAt: '',
          whyNow: '',
          risks: [],
          nextSteps: [],
        }))
        setProjects(mapped)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (projects.length === 0) return
    const saved = localStorage.getItem(STARRED_KEY)
    // STARRED_NONE означает что пользователь намеренно снял звёздочку
    if (saved === STARRED_NONE) setStarredId(null)
    else if (saved) setStarredId(saved)
    // Если ничего не сохранено — не выбираем автоматически
  }, [projects])

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = starredId === id ? null : id
    setStarredId(next)
    // Сохраняем STARRED_NONE чтобы при перезагрузке не выбирался первый проект
    localStorage.setItem(STARRED_KEY, next ?? STARRED_NONE)
  }

  const openProject = (id: string) => router.push(`/projects/${id}`)

  const starred = projects.find(p => p.id === starredId)
  const q = search.trim().toLowerCase()
  const rest = projects
    .filter(p => p.id !== starredId)
    .filter(p => !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
            Мои проекты
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
            {projects.length} идей · отметь ⭐ активный проект
          </p>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
          background: "var(--accent)", color: "#fff", border: "none",
          borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
        }}>
          <Plus size={14} />
          Новый проект
        </button>
      </div>

      {/* Active project */}
      {starred && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Sparkles size={13} color="#6366F1" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              В работе
            </span>
          </div>

          <div
            onClick={() => openProject(starred.id)}
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, var(--bg-surface) 60%)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderLeft: "3px solid var(--accent)",
              borderRadius: 14, padding: "24px 28px",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, var(--bg-elevated) 60%)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, var(--bg-surface) 60%)"}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
              {/* Left */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                    background: tierColors[starred.tier] + "25", color: tierColors[starred.tier], letterSpacing: "0.5px",
                  }}>{starred.tier === "S" ? "🔥 Hot" : starred.tier === "A" ? "Middle" : "Low"}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                    background: stageColor[starred.stage] + "20", color: stageColor[starred.stage],
                  }}>{stageLabel[starred.stage]}</span>
                  <button
                    onClick={e => toggleStar(starred.id, e)}
                    style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                  >
                    <Star size={16} fill="#F59E0B" color="#F59E0B" />
                  </button>
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.3px" }}>
                  {starred.title}
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.5 }}>
                  {starred.description}
                </p>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {starred.tags.map(t => <Tag key={t} label={t} />)}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Аудитория: </span>{starred.audience}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>{starred.price}</span>
                </div>
              </div>

              {/* Right: scores */}
              <div style={{ width: 220, flexShrink: 0 }}>
                <div style={{ marginBottom: 16 }}>
                  <ScoreBar label="Рынок" value={starred.market} />
                  <ScoreBar label="Боль" value={starred.pain} />
                  <ScoreBar label="Монетизация" value={starred.mono} />
                  <ScoreBar label="Скорость" value={starred.speed} />
                  <ScoreBar label="Конкуренция" value={starred.competition} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: scoreColor(starred.score) }}>{starred.score}</span>
                  <button
                    onClick={e => { e.stopPropagation(); openProject(starred.id) }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", background: "var(--accent)", color: "#fff",
                      border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
                    }}
                  >
                    Открыть <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All projects grid */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", flexShrink: 0 }}>
          Все проекты · {rest.length}
        </span>
        <div style={{ position: "relative", maxWidth: 280, flex: 1 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Найти идею..."
            style={{
              width: "100%", padding: "6px 10px 6px 30px",
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: 8, fontSize: 12, color: "var(--text-primary)",
              outline: "none", fontFamily: "inherit", boxSizing: "border-box",
            }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {rest.map(project => (
          <div
            key={project.id}
            onClick={() => openProject(project.id)}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12, padding: "18px 20px",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = "var(--bg-elevated)"
              el.style.borderColor = "rgba(99,102,241,0.2)"
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = "var(--bg-surface)"
              el.style.borderColor = "var(--border)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                  background: tierColors[project.tier] + "20", color: tierColors[project.tier], letterSpacing: "0.4px",
                }}>{project.tier === "S" ? "🔥 Hot" : project.tier === "A" ? "Middle" : "Low"}</span>
                <span style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 4,
                  background: stageColor[project.stage] + "15", color: stageColor[project.stage],
                }}>{stageLabel[project.stage]}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(project.score) }}>{project.score}</span>
                <button
                  onClick={e => toggleStar(project.id, e)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, opacity: 0.4, transition: "opacity 0.15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.4"}
                >
                  <Star size={14} color="#F59E0B" />
                </button>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.3 }}>
              {project.title}
            </div>

            <div style={{
              fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {project.description}
            </div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              {project.tags.map(t => <Tag key={t} label={t} />)}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>{project.price}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{project.competitors.length} конкурента</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
