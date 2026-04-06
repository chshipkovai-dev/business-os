"use client"
import { useState, useEffect } from "react"
import { Search, Loader2, Zap, Clock, TrendingUp, Users, ChevronDown, ChevronUp } from "lucide-react"
import { useLang } from "@/lib/lang"
import { t } from "@/lib/translations"

type Tier = "Все" | "S" | "A" | "B" | "New" | "Archived"
type Sphere = "все" | "freelance" | "local-biz" | "saas-dev" | "b2b-sales" | "professional" | "czech"

const SPHERES_META: { value: Sphere; ru: string; en: string; emoji: string; color: string }[] = [
  { value: "все",          ru: "Все сферы",       en: "All spheres",   emoji: "🌐", color: "#6366F1" },
  { value: "freelance",    ru: "Фриланс",          en: "Freelance",     emoji: "🧑‍💻", color: "#10B981" },
  { value: "local-biz",    ru: "Малый бизнес",     en: "Local biz",     emoji: "🏪", color: "#F59E0B" },
  { value: "saas-dev",     ru: "SaaS / Dev",       en: "SaaS / Dev",    emoji: "💻", color: "#3B82F6" },
  { value: "b2b-sales",    ru: "B2B / Продажи",    en: "B2B / Sales",   emoji: "📊", color: "#8B5CF6" },
  { value: "professional", ru: "Профессии",        en: "Professions",   emoji: "⚖️", color: "#EC4899" },
  { value: "czech",        ru: "🇨🇿 Чехия",        en: "🇨🇿 Czech",     emoji: "🇨🇿", color: "#EF4444" },
]

interface Idea {
  id: number
  title: string
  description: string
  score: number
  tier: string
  market: number
  mono: number
  speed: number
  competition: number
  audience: string
  tags: string[]
  status: string
  created_at: string | null
  problem?: string
  target_audience?: string
}

interface Research {
  summary: string
  market_size: string
  competitors: { name: string; price: string; weakness: string }[]
  icp: string
  build_time_days: number
  weeks_to_first_revenue: number
  mrr_month1: number
  mrr_month3: number
  revenue_potential: string
  build_plan: string
  speed_score: number
  first_action?: string
}

const tierColors: Record<string, string> = {
  S: "rgba(99,102,241,0.2)", A: "rgba(59,130,246,0.2)", B: "rgba(82,84,114,0.2)",
}
const tierTextColors: Record<string, string> = {
  S: "#818CF8", A: "#60A5FA", B: "#8B8FA8",
}
const statusColors: Record<string, string> = {
  active: "#22C55E", building: "#6366F1", new: "#F59E0B",
}
const statusLabels: Record<string, { ru: string; en: string }> = {
  active:   { ru: "Активный", en: "Active" },
  building: { ru: "Строим",   en: "Building" },
  new:      { ru: "Идея",     en: "Idea" },
}

function scoreColor(val: number) {
  if (val >= 8) return "var(--success)"
  if (val >= 6) return "var(--warning)"
  return "var(--danger)"
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ width: 90, fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value * 10}%`, background: scoreColor(value), borderRadius: 2 }} />
      </div>
      <span style={{ width: 16, fontSize: 11, color: "var(--text-secondary)", textAlign: "right" }}>{value}</span>
    </div>
  )
}

function ResearchPanel({ research, lang }: { research: Research; lang: string }) {
  const id = t.ideas
  return (
    <div style={{
      marginTop: 16, padding: "20px 20px 16px", borderTop: "1px solid var(--border)",
      background: "rgba(99,102,241,0.04)", borderRadius: "0 0 12px 12px",
    }}>
      {/* Key metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { icon: <Zap size={13} />, label: `${id.weeksRevenue[lang as "ru"|"en"]}`, value: `${research.weeks_to_first_revenue}`, color: "#22C55E" },
          { icon: <Clock size={13} />, label: `${id.buildDays[lang as "ru"|"en"]}`, value: `${research.build_time_days}`, color: "#6366F1" },
          { icon: <TrendingUp size={13} />, label: id.mrr1[lang as "ru"|"en"], value: `$${research.mrr_month1}`, color: "#F59E0B" },
          { icon: <TrendingUp size={13} />, label: id.mrr3[lang as "ru"|"en"], value: `$${research.mrr_month3}`, color: "#22C55E" },
        ].map(m => (
          <div key={m.label} style={{
            background: "var(--bg-elevated)", borderRadius: 8, padding: "10px 12px",
            border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: m.color, marginBottom: 4 }}>
              {m.icon}
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Резюме */}
      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
        {research.summary}
      </div>

      {/* Competitors */}
      {research.competitors?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
            {id.competitors[lang as "ru"|"en"]}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {research.competitors.map((c, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--bg-elevated)", borderRadius: 6, padding: "7px 10px",
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", minWidth: 120 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: "#6366F1", minWidth: 60 }}>{c.price}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>⚡ {c.weakness}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ICP */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
          {id.icp[lang as "ru"|"en"]}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 6, borderLeft: "3px solid #6366F1" }}>
          <Users size={11} style={{ marginRight: 5, color: "#6366F1" }} />{research.icp}
        </div>
      </div>

      {/* Build plan */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
          {id.buildPlan[lang as "ru"|"en"]}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {research.build_plan}
        </div>
      </div>

      {/* Первый шаг */}
      {research.first_action && (
        <div style={{
          padding: "10px 14px", background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8,
          fontSize: 12, color: "#22C55E", lineHeight: 1.5,
        }}>
          <strong>{id.firstAction[lang as "ru"|"en"]}:</strong> {research.first_action}
        </div>
      )}
    </div>
  )
}

type SortKey = "score_desc" | "score_asc" | "newest" | "alpha_asc" | "alpha_desc" | "market" | "mono" | "speed" | "competition"

const sortOptionsRu: { value: SortKey; label: string }[] = [
  { value: "score_desc", label: "Оценка ↓" },
  { value: "score_asc",  label: "Оценка ↑" },
  { value: "newest",     label: "🆕 Новые первыми" },
  { value: "alpha_asc",  label: "A → Z" },
  { value: "alpha_desc", label: "Z → A" },
  { value: "market",     label: "Рынок ↓" },
  { value: "mono",       label: "Монетизация ↓" },
  { value: "speed",      label: "Скорость ↓" },
  { value: "competition",label: "Конкуренция ↓" },
]

const sortOptionsEn: { value: SortKey; label: string }[] = [
  { value: "score_desc", label: "Score ↓" },
  { value: "score_asc",  label: "Score ↑" },
  { value: "newest",     label: "🆕 Newest first" },
  { value: "alpha_asc",  label: "A → Z" },
  { value: "alpha_desc", label: "Z → A" },
  { value: "market",     label: "Market ↓" },
  { value: "mono",       label: "Monetization ↓" },
  { value: "speed",      label: "Speed ↓" },
  { value: "competition",label: "Competition ↓" },
]

export default function IdeasPage() {
  const { lang } = useLang()
  const id = t.ideas
  const SPHERES = SPHERES_META.map(s => ({ ...s, label: lang === "ru" ? s.ru : s.en }))
  const sortOptions = lang === "ru" ? sortOptionsRu : sortOptionsEn
  const [filter, setFilter] = useState<Tier>("Все")
  const [sphere, setSphere] = useState<Sphere>("все")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("score_desc")
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [researching, setResearching] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, Research>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const isNew = (idea: Idea) => {
    if (!idea.created_at) return false
    const days = (Date.now() - new Date(idea.created_at).getTime()) / (1000 * 60 * 60 * 24)
    return days <= 7
  }

  useEffect(() => {
    setLoading(true)
    const url = filter === "Archived" ? '/api/ideas?archived=true' : '/api/ideas'
    fetch(url)
      .then(r => r.json())
      .then(data => { setIdeas(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  const handleResearch = async (idea: Idea) => {
    setResearching(idea.title)
    setExpanded(idea.title)
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      })
      const data = await res.json()
      setResults(prev => ({ ...prev, [idea.title]: data }))
    } catch {
      // ignore
    } finally {
      setResearching(null)
    }
  }

  const filtered = ideas
    .filter(i => {
      if (filter === "Все" || filter === "Archived") return true
      if (filter === "New") return isNew(i)
      return i.tier === filter
    })
    .filter(i => sphere === "все" || (i.tags || []).includes(`sphere:${sphere}`))
    .filter(i => !search.trim() || i.title.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sort) {
        case "score_desc":   return b.score - a.score
        case "score_asc":    return a.score - b.score
        case "newest":       return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        case "alpha_asc":    return a.title.localeCompare(b.title, "ru")
        case "alpha_desc":   return b.title.localeCompare(a.title, "ru")
        case "market":       return b.market - a.market
        case "mono":         return b.mono - a.mono
        case "speed":        return b.speed - a.speed
        case "competition":  return b.competition - a.competition
        default:             return 0
      }
    })

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>{id.title[lang]}</h1>
        <span style={{
          background: "rgba(99,102,241,0.15)", color: "var(--accent)",
          fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 999,
        }}>{loading ? "..." : ideas.length}</span>
      </div>

      {/* Строка поиска + сортировка */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === "ru" ? "Поиск по названию или описанию..." : "Search by title or description..."}
            style={{
              width: "100%", padding: "8px 12px 8px 32px",
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: 8, fontSize: 13, color: "var(--text-primary)",
              outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          style={{
            padding: "8px 12px", background: "var(--bg-elevated)",
            border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8,
            fontSize: 13, color: "var(--text-primary)", cursor: "pointer",
            outline: "none", fontFamily: "inherit", appearance: "auto",
          }}
        >
          {sortOptions.map(o => (
            <option key={o.value} value={o.value} style={{ background: "#111118" }}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Фильтры по сфере */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {SPHERES.map(s => {
          const count = s.value === "все"
            ? ideas.length
            : ideas.filter(i => (i.tags || []).includes(`sphere:${s.value}`)).length
          const active = sphere === s.value
          return (
            <button key={s.value} onClick={() => setSphere(s.value)} style={{
              padding: "5px 14px", borderRadius: 20,
              border: active ? `1px solid ${s.color}` : "1px solid var(--border)",
              background: active ? `${s.color}22` : "transparent",
              color: active ? s.color : "var(--text-muted)",
              fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
            }}>
              <span>{s.emoji}</span>
              <span>{s.label}</span>
              <span style={{
                background: active ? `${s.color}33` : "var(--bg-elevated)",
                color: active ? s.color : "var(--text-muted)",
                fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 999,
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Тир-фильтры */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {(["Все", "S", "A", "B"] as Tier[]).map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: "6px 16px", borderRadius: 8,
            border: filter === t ? "1px solid var(--accent)" : "1px solid var(--border)",
            background: filter === t ? "rgba(99,102,241,0.15)" : "transparent",
            color: filter === t ? "var(--accent)" : "var(--text-secondary)",
            fontSize: 13, fontWeight: filter === t ? 500 : 400, cursor: "pointer",
          }}>
            {t === "Все" ? `All (${ideas.length})` : t === "S" ? `🔥 Hot (${ideas.filter(i => i.tier === "S").length})` : t === "A" ? `Middle (${ideas.filter(i => i.tier === "A").length})` : `Low (${ideas.filter(i => i.tier === "B").length})`}
          </button>
        ))}
        <button onClick={() => { setFilter("New"); setSort("newest") }} style={{
          padding: "6px 16px", borderRadius: 8,
          border: filter === "New" ? "1px solid #22C55E" : "1px solid var(--border)",
          background: filter === "New" ? "rgba(34,197,94,0.12)" : "transparent",
          color: filter === "New" ? "#22C55E" : "var(--text-muted)",
          fontSize: 13, fontWeight: filter === "New" ? 500 : 400, cursor: "pointer",
        }}>
          🆕 {lang === "ru" ? "Новые (7д)" : "New (7d)"} ({ideas.filter(isNew).length})
        </button>
        <button onClick={() => setFilter("Archived")} style={{
          padding: "6px 16px", borderRadius: 8,
          border: filter === "Archived" ? "1px solid #EF4444" : "1px solid var(--border)",
          background: filter === "Archived" ? "rgba(239,68,68,0.1)" : "transparent",
          color: filter === "Archived" ? "#EF4444" : "var(--text-muted)",
          fontSize: 13, cursor: "pointer",
        }}>
          🗄 Archived
        </button>
        {(search || sort !== "score_desc" || sphere !== "все") && (
          <button onClick={() => { setSearch(""); setSort("score_desc"); setFilter("Все"); setSphere("все") }} style={{
            padding: "6px 12px", borderRadius: 8, marginLeft: "auto",
            border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.06)",
            color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", transition: "all 0.15s",
          }}>
            {lang === "ru" ? "Сбросить" : "Reset"}
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: 60, fontSize: 14 }}>
          {id.loading[lang]}
        </div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(idea => {
            const isResearching = researching === idea.title
            const research = results[idea.title]
            const isExpanded = expanded === idea.title

            return (
              <div key={idea.id} style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: 12, overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                borderColor: isExpanded ? "rgba(99,102,241,0.3)" : "var(--border)",
              }}>
                {/* Основная карточка */}
                <div style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                    {/* Левая часть */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{
                          background: tierColors[idea.tier] || tierColors.B,
                          color: tierTextColors[idea.tier] || tierTextColors.B,
                          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                        }}>{idea.tier === "S" ? "🔥 Hot" : idea.tier === "A" ? "Middle" : "Low"}</span>
                        {isNew(idea) && (
                          <span style={{
                            background: "rgba(34,197,94,0.15)", color: "#22C55E",
                            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                            letterSpacing: "0.3px",
                          }}>NEW</span>
                        )}
                        {idea.status !== 'new' && (
                          <span style={{
                            background: (statusColors[idea.status] || '#F59E0B') + '20',
                            color: statusColors[idea.status] || '#F59E0B',
                            fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 6,
                          }}>{(statusLabels[idea.status]?.[lang as "ru"|"en"]) || idea.status}</span>
                        )}
                        <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor(idea.score), marginLeft: "auto" }}>
                          {idea.score}
                        </span>
                      </div>

                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 5 }}>
                        {idea.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>
                        {idea.description}
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(() => {
                          const sphereTag = (idea.tags || []).find(tag => tag.startsWith('sphere:'))?.replace('sphere:', '') as Sphere | undefined
                          const sphereMeta = sphereTag ? SPHERES.find(s => s.value === sphereTag) : null
                          return sphereMeta ? (
                            <span style={{
                              background: `${sphereMeta.color}18`, color: sphereMeta.color,
                              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                              border: `1px solid ${sphereMeta.color}33`,
                            }}>{sphereMeta.emoji} {sphereMeta.label}</span>
                          ) : null
                        })()}
                        {(idea.tags || []).filter(tag => !tag.startsWith('sphere:')).map(tag => (
                          <span key={tag} style={{
                            background: "var(--bg-elevated)", color: "var(--text-muted)",
                            fontSize: 11, padding: "2px 8px", borderRadius: 999,
                          }}>{tag}</span>
                        ))}
                      </div>
                    </div>

                    {/* Правая часть: скорбары + кнопка */}
                    <div style={{ width: 200, flexShrink: 0 }}>
                      <ScoreBar label={id.market[lang as "ru"|"en"]} value={idea.market} />
                      <ScoreBar label={id.mono[lang as "ru"|"en"]} value={idea.mono} />
                      <ScoreBar label={id.speed[lang as "ru"|"en"]} value={idea.speed} />
                      <ScoreBar label={id.competition[lang as "ru"|"en"]} value={idea.competition} />

                      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                        <button
                          onClick={() => handleResearch(idea)}
                          disabled={isResearching}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            padding: "8px 12px", borderRadius: 8,
                            background: isResearching ? "var(--bg-elevated)" : "var(--accent)",
                            color: isResearching ? "var(--text-muted)" : "#fff",
                            border: "none", fontSize: 12, fontWeight: 500, cursor: isResearching ? "default" : "pointer",
                          }}
                        >
                          {isResearching
                            ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> {id.researching[lang]}</>
                            : <><Search size={12} /> {id.researchBtn[lang]}</>
                          }
                        </button>
                        {research && (
                          <button
                            onClick={() => setExpanded(isExpanded ? null : idea.title)}
                            style={{
                              padding: "8px 10px", borderRadius: 8, background: "var(--bg-elevated)",
                              border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer",
                            }}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Панель результатов */}
                {isExpanded && isResearching && (
                  <div style={{
                    padding: "20px", borderTop: "1px solid var(--border)",
                    display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)", fontSize: 13,
                  }}>
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "#6366F1" }} />
                    {lang === "ru" ? "Claude исследует рынок, конкурентов и считает доход..." : "Claude is researching the market, competitors, and revenue..."}
                  </div>
                )}
                {isExpanded && research && <ResearchPanel research={research} lang={lang} />}
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
