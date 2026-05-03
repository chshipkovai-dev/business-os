"use client"

import { useState } from "react"

interface BossResult {
  task: string
  complexity?: string
  project_type?: string
  route?: string
  ok?: boolean
  error?: string
}

export default function TeamPage() {
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<BossResult[]>([])
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
      desc: "Читает pending задачи, определяет project_type (web/n8n/automation/agent/api), сложность и требования. Маршрутизирует в Planning или Builder.",
      tasks: ["Определение project_type", "Декомпозиция задач", "Маршрутизация по агентам", "Telegram-отчёты"],
      stack: ["Claude Sonnet", "Supabase", "Telegram"],
    },
    {
      id: "planning", role: "01 — АНАЛИТИК", name: "Planning Agent", emoji: "📋",
      color: "#00e5ff", color2: "#10b981", status: "active",
      desc: "Получает сложные задачи, делает глубокий анализ: use cases, user flow, структуру файлов, edge cases. Отправляет план на апрув в Telegram.",
      tasks: ["Use cases и user flow", "Структура файлов (макс. 8)", "Edge cases и риски", "План по дням", "Апрув через Telegram"],
      stack: ["Claude Sonnet", "Supabase", "Telegram"],
    },
    {
      id: "builder", role: "02 — РАЗРАБОТЧИК", name: "Builder Agent", emoji: "⚙️",
      color: "#7c3aed", color2: "#a78bfa", status: "active",
      desc: "Генерирует production код под project_type: Next.js для web, JSON workflow для n8n, TypeScript скрипты для automation, Anthropic SDK для agent.",
      tasks: ["Next.js + TypeScript + Tailwind (web)", "n8n JSON workflows", "Automation скрипты", "Claude API агенты", "GitHub push через API"],
      stack: ["Claude Sonnet", "GitHub API", "Next.js", "n8n"],
    },
    {
      id: "reviewer", role: "03 — РЕВЬЮЕР", name: "Reviewer Agent", emoji: "🔎",
      color: "#f59e0b", color2: "#fbbf24", status: "active",
      desc: "Code review перед Tester. 25 пунктов для web (code quality, TypeScript, accessibility, mobile, conversion), 15 пунктов для n8n/automation. Только CRITICAL и MAJOR проблемы.",
      tasks: ["Code quality (250 строк макс.)", "TypeScript типизация", "Accessibility (aria, labels)", "Mobile breakpoints", "Conversion (CTA, headlines)"],
      stack: ["Claude Sonnet", "GitHub API"],
    },
    {
      id: "tester", role: "04 — ТЕСТИРОВЩИК", name: "Tester Agent", emoji: "🧪",
      color: "#10b981", color2: "#34d399", status: "active",
      desc: "Статический анализ кода. Проверяет весь репо через GitHub Trees API — ловит zombie-файлы от старых ранов. Разные чеклисты под каждый project_type.",
      tasks: ["Импорты и зависимости", "TypeScript ошибки", "Запрещённые пакеты", "JSX escaping", "Checklist под project_type"],
      stack: ["Claude Sonnet", "GitHub Trees API"],
    },
    {
      id: "seo", role: "05 — SEO", name: "SEO Agent", emoji: "📈",
      color: "#06b6d4", color2: "#0891b2", status: "active",
      desc: "Только для web. Улучшает metadata в layout.tsx: title, description, Open Graph, Twitter Card, robots. Пушит обновлённый файл в GitHub перед деплоем.",
      tasks: ["Title и description", "Open Graph теги", "Twitter Card", "Robots и canonical", "Обновление layout.tsx"],
      stack: ["Claude Sonnet", "GitHub API"],
    },
    {
      id: "deployment-monitor", role: "06 — МОНИТОРИНГ", name: "Deployment Monitor", emoji: "🚀",
      color: "#8b5cf6", color2: "#7c3aed", status: "active",
      desc: "Polling Vercel API каждые 30с (до 5 минут). READY → URL в Telegram + запуск QA. ERROR → парсит build logs → возвращает Builder на фикс.",
      tasks: ["Polling Vercel API", "Парсинг build logs", "URL в Telegram", "Роутинг на QA или Builder"],
      stack: ["Vercel API", "Telegram"],
    },
    {
      id: "qa", role: "07 — QA", name: "QA Agent", emoji: "✅",
      color: "#ec4899", color2: "#db2777", status: "active",
      desc: "Загружает задеплоенную страницу, Claude анализирует HTML: H1, CTA кнопка, форма, навигация, meta теги. Score < 4/5 → Builder retry.",
      tasks: ["H1 и структура", "CTA кнопка видна", "Форма с label", "Nav без broken links", "Meta теги"],
      stack: ["Claude Sonnet", "HTTP fetch"],
    },
  ]

  const chain = [
    { id: "boss", label: "Boss" },
    { id: "planning", label: "Planning" },
    { id: "builder", label: "Builder" },
    { id: "reviewer", label: "Reviewer" },
    { id: "tester", label: "Tester" },
    { id: "seo", label: "SEO*" },
    { id: "deployment-monitor", label: "Deploy Monitor" },
    { id: "qa", label: "QA*" },
  ]

  const agentColorMap: Record<string, string> = {
    builder: "#7c3aed", designer: "#f59e0b", marketing: "#10b981",
    boss: "#00e5ff", planning: "#10b981", reviewer: "#f59e0b",
    tester: "#10b981", seo: "#06b6d4", "deployment-monitor": "#8b5cf6", qa: "#ec4899",
  }

  const routeColorMap: Record<string, string> = {
    planning: "#00e5ff", builder: "#7c3aed",
  }

  return (
    <div style={{ animation: "fadeIn 0.25s ease", maxWidth: 960 }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 10, color: "#00e5ff", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginBottom: 8 }}>// ai команда</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-display)" }}>ailnex AI Team</h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, fontFamily: "var(--font-mono)" }}>8 агентов · все активны · универсальная архитектура</p>
      </div>

      {/* Pipeline chain */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px", marginBottom: 32 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginBottom: 16 }}>цепочка выполнения</div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", rowGap: 8 }}>
          {chain.map((step, i) => {
            const agent = agents.find(a => a.id === step.id)
            return (
              <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ padding: "5px 12px", borderRadius: 6, background: `${agent?.color ?? "#888"}18`, border: `1px solid ${agent?.color ?? "#888"}35`, fontSize: 10, color: agent?.color ?? "#888", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                  {agent?.emoji} {step.label}
                </div>
                {i < chain.length - 1 && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "0 4px" }}>→</div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          * SEO и QA — только для <span style={{ color: "#06b6d4" }}>project_type: web</span>
        </div>
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
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 12, flexWrap: "wrap" }}>
                <span style={{ color: r.ok === false ? "#ef4444" : "#10b981" }}>{r.ok === false ? "✗" : "✓"}</span>
                <span style={{ flex: 1, color: "var(--text-primary)", minWidth: 120 }}>{r.task}</span>
                {r.project_type && (
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(6,182,212,0.12)", color: "#06b6d4", letterSpacing: "1px", textTransform: "uppercase" }}>{r.project_type}</span>
                )}
                {r.complexity && (
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: r.complexity === "complex" ? "rgba(124,58,237,0.15)" : "rgba(16,185,129,0.12)", color: r.complexity === "complex" ? "#a78bfa" : "#10b981", letterSpacing: "1px", textTransform: "uppercase" }}>{r.complexity}</span>
                )}
                {r.route && (
                  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: `${routeColorMap[r.route] ?? "#888"}18`, color: routeColorMap[r.route] ?? "#888", letterSpacing: "1px", textTransform: "uppercase" }}>→ {r.route}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {agents.map((agent) => (
          <div key={agent.id}
            style={{ background: "var(--bg-surface)", border: `1px solid ${agent.color}25`, borderLeft: `3px solid ${agent.color}`, borderRadius: 14, padding: "24px 28px", position: "relative", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateX(4px)"; el.style.boxShadow = `0 4px 24px ${agent.color}15` }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateX(0)"; el.style.boxShadow = "none" }}
          >
            <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", pointerEvents: "none", background: `radial-gradient(circle, ${agent.color}10 0%, transparent 70%)` }} />
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: `linear-gradient(135deg, ${agent.color}20, ${agent.color2}20)`, border: `1px solid ${agent.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{agent.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 9, color: agent.color, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>{agent.role}</div>
                  <div style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#10b981", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "var(--font-mono)", border: "1px solid rgba(16,185,129,0.3)" }}>АКТИВЕН</div>
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
