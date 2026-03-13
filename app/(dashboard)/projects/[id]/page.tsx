"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { initialProjects, stageLabel, stageColor, type Stage } from "@/lib/projects"
import { ArrowLeft, Brain, CheckSquare, Square, Send, Star } from "lucide-react"

const STARRED_KEY = "business_os_starred"
const TASKS_KEY = "business_os_tasks_"
const STAGE_KEY = "business_os_stage_"

const scoreColor = (v: number) => v >= 8 ? "#22C55E" : v >= 6 ? "#F59E0B" : "#EF4444"
const tierColors: Record<string, string> = { S: "#6366F1", A: "#3B82F6", B: "#525472" }

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)", width: 100, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value * 10}%`, height: "100%", background: scoreColor(value), borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", width: 18, textAlign: "right", fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function SectionCard({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderLeft: `3px solid ${accent || "var(--border)"}`,
      borderRadius: 12, padding: "20px 24px", marginBottom: 16,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

type Tab = "overview" | "plan" | "advisor" | "dev"

interface Message { role: "user" | "ai"; text: string }

function ProjectPageInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const project = initialProjects.find(p => p.id === id)

  const tabFromUrl = (searchParams.get("tab") as Tab) || "overview"
  const [tab, setTab] = useState<Tab>(tabFromUrl)

  // Sync tab when URL param changes (sidebar clicks)
  useEffect(() => {
    const t = (searchParams.get("tab") as Tab) || "overview"
    setTab(t)
  }, [searchParams])
  const [starredId, setStarredId] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>(project?.stage ?? "idea")
  const [tasks, setTasks] = useState<boolean[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STARRED_KEY)
    setStarredId(saved || "amazon-listing-ai")
  }, [])

  useEffect(() => {
    if (!project) return
    const savedStage = localStorage.getItem(STAGE_KEY + id) as Stage | null
    if (savedStage) setStage(savedStage)
    const savedTasks = localStorage.getItem(TASKS_KEY + id)
    if (savedTasks) setTasks(JSON.parse(savedTasks))
    else setTasks(project.nextSteps.map(() => false))
    setMessages([{
      role: "ai",
      text: `Привет! Готов помочь с анализом **${project.title}**.\n\nМогу рассказать про конкурентов, стратегию запуска, монетизацию или риски. Что тебя интересует?`,
    }])
  }, [id, project])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!project) {
    return (
      <div style={{ padding: 40, color: "var(--text-secondary)" }}>
        Проект не найден.{" "}
        <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => router.push("/")}>← Назад</span>
      </div>
    )
  }

  const toggleStar = () => {
    const next = starredId === id ? null : id
    setStarredId(next)
    if (next) localStorage.setItem(STARRED_KEY, next)
    else localStorage.removeItem(STARRED_KEY)
  }

  const toggleTask = (i: number) => {
    const next = [...tasks]
    next[i] = !next[i]
    setTasks(next)
    localStorage.setItem(TASKS_KEY + id, JSON.stringify(next))
  }

  const setStageAndSave = (s: Stage) => {
    setStage(s)
    localStorage.setItem(STAGE_KEY + id, s)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: userMsg }])
    setLoading(true)
    setMessages(prev => [...prev, { role: "ai", text: "" }])

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, ideaContext: project }),
      })
      if (!res.body) throw new Error("No stream")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: "ai", text: accumulated }
          return copy
        })
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: "ai", text: "Ошибка соединения. Проверь ANTHROPIC_API_KEY в .env.local" }
        return copy
      })
    }
    setLoading(false)
  }

  const stages: Stage[] = ["idea", "research", "building", "launched"]

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Обзор" },
    { id: "plan", label: "Бизнес план" },
    { id: "advisor", label: "AI Советник" },
    { id: "dev", label: "Разработка" },
  ]

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      {/* Back */}
      <button
        onClick={() => router.push("/")}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          color: "var(--text-muted)", fontSize: 13, cursor: "pointer", padding: "0 0 20px", transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
      >
        <ArrowLeft size={14} /> Все проекты
      </button>

      {/* Project header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                background: tierColors[project.tier] + "25", color: tierColors[project.tier], letterSpacing: "0.5px",
              }}>{project.tier === "S" ? "🔥 Hot" : project.tier === "A" ? "Middle" : "Low"}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                background: stageColor[stage] + "20", color: stageColor[stage],
              }}>{stageLabel[stage]}</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.4px" }}>
              {project.title}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {project.description}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: scoreColor(project.score) }}>{project.score}</span>
            <button
              onClick={toggleStar}
              title={starredId === id ? "Снять с активного" : "Сделать активным"}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                background: starredId === id ? "rgba(245,158,11,0.15)" : "var(--bg-elevated)",
                border: `1px solid ${starredId === id ? "rgba(245,158,11,0.4)" : "var(--border)"}`,
                borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                fontSize: 12, color: starredId === id ? "#F59E0B" : "var(--text-secondary)",
              }}
            >
              <Star size={14} fill={starredId === id ? "#F59E0B" : "none"} color="#F59E0B" />
              {starredId === id ? "В работе" : "Сделать активным"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); router.replace(`/projects/${id}?tab=${t.id}`, { scroll: false }) }}
            style={{
              padding: "8px 16px", background: "none", border: "none",
              borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              color: tab === t.id ? "var(--accent)" : "var(--text-secondary)",
              fontSize: 13, fontWeight: tab === t.id ? 500 : 400,
              cursor: "pointer", transition: "all 0.15s", marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <SectionCard title="Оценки" accent="#6366F1">
              <ScoreBar label="Рынок" value={project.market} />
              <ScoreBar label="Боль" value={project.pain} />
              <ScoreBar label="Монетизация" value={project.mono} />
              <ScoreBar label="Скорость запуска" value={project.speed} />
              <ScoreBar label="Конкуренция" value={project.competition} />
            </SectionCard>
            <SectionCard title="Аудитория и монетизация" accent="#3B82F6">
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Целевая аудитория</div>
                <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{project.audience}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Цена</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--accent)" }}>{project.price}</div>
              </div>
            </SectionCard>
          </div>
          <div>
            <SectionCard title="Почему сейчас" accent="#22C55E">
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{project.whyNow}</p>
            </SectionCard>
            <SectionCard title="Конкуренты" accent="#F59E0B">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {project.competitors.map(c => (
                  <span key={c} style={{
                    fontSize: 12, padding: "4px 10px", borderRadius: 6,
                    background: "var(--bg-elevated)", color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}>{c}</span>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Теги" accent="var(--border)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {project.tags.map(t => (
                  <span key={t} style={{
                    fontSize: 12, padding: "4px 10px", borderRadius: 20,
                    background: "rgba(99,102,241,0.1)", color: "var(--accent)",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}>{t}</span>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Tab: Business Plan */}
      {tab === "plan" && (
        <div>
          <SectionCard title="Описание продукта" accent="#6366F1">
            <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7, margin: "0 0 12px" }}>{project.description}</p>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Аудитория</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{project.audience}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Цена</div>
                <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{project.price}</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Анализ рынка — почему сейчас" accent="#3B82F6">
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{project.whyNow}</p>
          </SectionCard>

          <SectionCard title="Конкуренты" accent="#F59E0B">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {project.competitors.map((c, i) => (
                <div key={c} style={{
                  padding: "12px 14px", borderRadius: 8,
                  background: "var(--bg-elevated)", border: "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>#{i + 1}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{c}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Риски" accent="#EF4444">
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {project.risks.map((r, i) => (
                <li key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "8px 0", borderBottom: i < project.risks.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ color: "#EF4444", fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>⚠</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{r}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Следующие шаги" accent="#22C55E">
            <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {project.nextSteps.map((s, i) => (
                <li key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "9px 0", borderBottom: i < project.nextSteps.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", background: "rgba(34,197,94,0.15)",
                    color: "#22C55E", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0, marginTop: 1,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>{s}</span>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      )}

      {/* Tab: AI Advisor */}
      {tab === "advisor" && (
        <div style={{ display: "flex", gap: 20, height: "calc(100vh - 280px)", minHeight: 400 }}>
          {/* Context panel */}
          <div style={{ width: 260, flexShrink: 0 }}>
            <div style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "16px 18px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 12 }}>
                Контекст
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{project.title}</div>
              <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 14 }}>{project.price}</div>
              <ScoreBar label="Рынок" value={project.market} />
              <ScoreBar label="Боль" value={project.pain} />
              <ScoreBar label="Монетизация" value={project.mono} />
              <ScoreBar label="Конкуренция" value={project.competition} />
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Подсказки:</div>
                {["Оцени конкурентов", "Что проверить первым?", "Как монетизировать?", "Главные риски?"].map(hint => (
                  <button key={hint} onClick={() => setInput(hint)} style={{
                    display: "block", width: "100%", textAlign: "left", padding: "5px 8px",
                    background: "var(--bg-elevated)", border: "1px solid var(--border)",
                    borderRadius: 6, fontSize: 11, color: "var(--text-secondary)",
                    cursor: "pointer", marginBottom: 4, transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(99,102,241,0.3)"; el.style.color = "var(--text-primary)" }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-secondary)" }}
                  >{hint}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden",
          }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "ai" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", background: "rgba(99,102,241,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2,
                    }}>
                      <Brain size={14} color="var(--accent)" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "75%", padding: "10px 14px", borderRadius: 12,
                    background: m.role === "user" ? "rgba(99,102,241,0.15)" : "var(--bg-elevated)",
                    border: `1px solid ${m.role === "user" ? "rgba(99,102,241,0.25)" : "var(--border)"}`,
                    fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}>
                    {m.text || (loading && i === messages.length - 1 ? "▋" : "")}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Задай вопрос про этот проект..."
                rows={1}
                style={{
                  flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "var(--text-primary)",
                  resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5,
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"}
                onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{
                  padding: "9px 14px", background: "var(--accent)", color: "#fff",
                  border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading || !input.trim() ? 0.5 : 1, transition: "opacity 0.15s",
                  display: "flex", alignItems: "center",
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Dev */}
      {tab === "dev" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <SectionCard title="Этап разработки" accent="#6366F1">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["idea", "research", "building", "launched"] as Stage[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStageAndSave(s)}
                    style={{
                      padding: "7px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                      background: stage === s ? stageColor[s] + "20" : "var(--bg-elevated)",
                      color: stage === s ? stageColor[s] : "var(--text-secondary)",
                      border: `1px solid ${stage === s ? stageColor[s] + "50" : "var(--border)"}`,
                      fontWeight: stage === s ? 600 : 400, transition: "all 0.15s",
                    }}
                  >
                    {stageLabel[s]}
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Метрики" accent="#22C55E">
              {[["MRR", "$0"], ["Пользователей", "0"], ["Регистраций", "0"]].map(([label, value]) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: "1px solid var(--border)",
                }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                Данные появятся после запуска
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Задачи" accent="#F59E0B">
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {project.nextSteps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => toggleTask(i)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 8px", background: "none", border: "none",
                    cursor: "pointer", borderRadius: 6, textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
                >
                  {tasks[i]
                    ? <CheckSquare size={16} color="#22C55E" style={{ flexShrink: 0, marginTop: 1 }} />
                    : <Square size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
                  }
                  <span style={{
                    fontSize: 13, lineHeight: 1.5,
                    color: tasks[i] ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: tasks[i] ? "line-through" : "none",
                  }}>{step}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "10px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {tasks.filter(Boolean).length} / {tasks.length} выполнено
              </span>
              <div style={{
                height: 4, width: 100, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", background: "#22C55E", borderRadius: 2,
                  width: `${tasks.length ? (tasks.filter(Boolean).length / tasks.length) * 100 : 0}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div style={{padding:40,color:"var(--text-muted)"}}>Загрузка...</div>}>
      <ProjectPageInner />
    </Suspense>
  )
}
