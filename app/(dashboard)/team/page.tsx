"use client"

import { useState } from "react"

interface AgentTask {
  task: string
  agent: string
  ok: boolean
}

export default function TeamPage() {
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<AgentTask[]>([])
  const [lastRun, setLastRun] = useState<string | null>(null)

  const runBoss = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/agent/boss', { method: 'POST' })
      const json = await res.json()
      setLastResult(json.results || [])
      setLastRun(new Date().toLocaleTimeString('ru-RU'))
    } catch { /* error */ } finally {
      setRunning(false)
    }
  }

  const agents = [
    {
      id: "boss", role: "00 — ОРКЕСТРАТОР", name: "Boss Agent", emoji: "🧠",
      color: "#00e5ff", color2: "#7c3aed", status: "active",
      desc: "Читает задачи из дашборда, анализирует тип, составляет план и делегирует нужному агенту.",
      tasks: ["Декомпозиция входящих задач", "Маршрутизация по агентам", "Составление плана выполнения", "Telegram-отчёты о статусе"],
      stack: ["Claude Sonnet", "Supabase", "Telegram FORGE"],
    },
    {
      id: "planning", role: "01 — АНАЛИТИК", name: "Planning Agent", emoji: "📋",
      color: "#00e5ff", color2: "#10b981", status: "active",
      desc: "Получает сложные задачи от Boss Agent, делает глубокий анализ: use cases, user flow, структуру файлов, edge cases и план по дням. Отправляет план на апрув в Telegram.",
      tasks: ["Анализ use cases и user flow", "Структура файлов и компонентов", "Edge cases и риски", "План разработки по дням", "Апрув через Telegram"],
      stack: ["Claude Sonnet", "Supabase", "Telegram FORGE"],
    },
    {
      id: "builder", role: "02 — РАЗРАБОТЧИК", name: "Builder Agent", emoji: "⚙️",
      color: "#7c3aed", color2: "#a78bfa", status: "planned",
      desc: "Пишет код, строит автоматизации, генерирует n8n workflows и Python скрипты по описанию задачи.",
      tasks: ["Next.js компоненты и API роуты", "n8n workflows по описанию", "Python скрипты автоматизации", "Supabase схемы и SQL"],
      stack: ["Claude Sonnet", "Python", "Next.js", "n8n"],
    },
    {
      id: "designer", role: "03 — ДИЗАЙНЕР", name: "Designer Agent", emoji: "🎨",
      color: "#f59e0b", color2: "#fbbf24", status: "planned",
      desc: "Создаёт UI компоненты, лендинги и визуальные концепции для продуктов ailnex.",
      tasks: ["Tailwind UI компоненты", "Лендинги для продуктов", "SVG иконки и иллюстрации", "Дизайн-ревью и UX советы"],
      stack: ["Claude Sonnet", "Tailwind", "SVG"],
    },
    {
      id: "marketing", role: "04 — МАРКЕТИНГ", name: "Marketing Agent", emoji: "📣",
      color: "#10b981", color2: "#34d399", status: "planned",
      desc: "Управляет Instagram ailnex, пишет LinkedIn посты, SEO контент и скрипты аутрича.",
      tasks: ["Instagram контент-план", "LinkedIn статьи об AI", "SEO страницы ailnex.com", "Email последовательности"],
      stack: ["Claude Sonnet", "Web Search", "n8n"],
    },
  ]

  const agentColor: Record<string, string> = { builder: "#7c3aed", designer: "#f59e0b", marketing: "#10b981", boss: "#00e5ff" }

  return (
    <div style={{ animation: "fadeIn 0.25s ease", maxWidth: 900 }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 10, color: "#00e5ff", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginBottom: 8 }}>// ai команда</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>ailnex AI Team</h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, fontFamily: "var(--font-mono)" }}>4 агента · 1 активен · оркестратор-архитектура</p>
      </div>

      {/* Boss trigger */}
      <div style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.06), rgba(124,58,237,0.06))", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 14, padding: "20px 24px", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: 4 }}>Запустить Boss Agent</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Обработает все pending задачи из планировщика
            {lastRun && <span style={{ color: "#00e5ff", marginLeft: 12 }}>последний запуск: {lastRun}</span>}
          </div>
        </div>
        <button onClick={runBoss} disabled={running} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: running ? "var(--bg-elevated)" : "#00e5ff", color: running ? "var(--text-muted)" : "#000", fontSize: 12, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", fontFamily: "var(--font-mono)", letterSpacing: "0.5px", boxShadow: running ? "none" : "0 0 20px rgba(0,229,255,0.3)", transition: "all 0.15s" }}>
          {running ? "⏳ РАБОТАЕТ..." : "▶ ЗАПУСТИТЬ"}
        </button>
      </div>

      {/* Results */}
      {lastResult.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginBottom: 12 }}>последний запуск</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lastResult.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                <span style={{ color: r.ok ? "#10b981" : "#ef4444" }}>{r.ok ? "✓" : "✗"}</span>
                <span style={{ flex: 1, color: "var(--text-primary)" }}>{r.task}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${agentColor[r.agent] || "#888"}18`, color: agentColor[r.agent] || "#888", letterSpacing: "1px", textTransform: "uppercase" }}>{r.agent}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {agents.map((agent) => (
          <div key={agent.id} style={{ background: "var(--bg-surface)", border: `1px solid ${agent.color}25`, borderLeft: `3px solid ${agent.color}`, borderRadius: 14, padding: "24px 28px", position: "relative", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateX(4px)"; el.style.boxShadow = `0 4px 24px ${agent.color}15` }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateX(0)"; el.style.boxShadow = "none" }}
          >
            <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", pointerEvents: "none", background: `radial-gradient(circle, ${agent.color}10 0%, transparent 70%)` }} />
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: `linear-gradient(135deg, ${agent.color}20, ${agent.color2}20)`, border: `1px solid ${agent.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{agent.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 9, color: agent.color, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>{agent.role}</div>
                  <div style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: agent.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(74,85,104,0.3)", color: agent.status === "active" ? "#10b981" : "#4a5568", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "var(--font-mono)", border: `1px solid ${agent.status === "active" ? "rgba(16,185,129,0.3)" : "rgba(74,85,104,0.4)"}` }}>{agent.status === "active" ? "АКТИВЕН" : "ЗАПЛАНИРОВАН"}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: 8 }}>{agent.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16, maxWidth: 600 }}>{agent.desc}</div>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginBottom: 8 }}>задачи</div>
                    {agent.tasks.map(task => (
                      <div key={task} style={{ display: "flex", gap: 7, fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                        <span style={{ color: agent.color, opacity: 0.7, flexShrink: 0 }}>→</span>{task}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginBottom: 8 }}>стек</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {agent.stack.map(s => (
                        <span key={s} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, background: `${agent.color}10`, color: agent.color, border: `1px solid ${agent.color}25`, fontFamily: "var(--font-mono)" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
