"use client"
import { useState } from "react"
import { ideas } from "@/lib/data"
import { Users, TrendingUp, BarChart2, DollarSign, AlertTriangle, CheckSquare, BookOpen } from "lucide-react"

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 8 ? "var(--success)" : value >= 6 ? "var(--warning)" : "var(--danger)"
  return (
    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:5}}>
      <span style={{width:80, fontSize:11, color:"var(--text-muted)", flexShrink:0}}>{label}</span>
      <div style={{flex:1, height:3, background:"var(--bg-elevated)", borderRadius:2, overflow:"hidden"}}>
        <div style={{height:"100%", width:`${value * 10}%`, background:color, borderRadius:2}} />
      </div>
      <span style={{width:14, fontSize:11, color:"var(--text-secondary)", textAlign:"right"}}>{value}</span>
    </div>
  )
}

const planData: Record<number, {
  audience: { who: string; size: string; pain: string }
  market: { whyNow: string; signals: string[] }
  competitors: { name: string; strengths: string; weaknesses: string; price: string }[]
  monetization: { tier: string; price: string; features: string[] }[]
  risks: string[]
  nextSteps: string[]
}> = {
  1: {
    audience: {
      who: "Amazon FBA продавцы — предприниматели, ведущие бизнес на Amazon",
      size: "9.7 миллионов активных продавцов на Amazon по всему миру",
      pain: "Оптимизация листингов требует часов работы и глубокого знания алгоритма A9. Большинство продавцов теряют 30-50% потенциального дохода из-за неоптимизированных листингов.",
    },
    market: {
      whyNow: "Amazon реклама растёт на 20%+ в год, конкуренция среди продавцов усиливается. ChatGPT показал рынку что AI может писать убедительный контент. Крупные игроки (Helium10) медленно внедряют AI-функции.",
      signals: [
        "Keyword 'Amazon listing optimization' — 89k поисков/мес (+34% YoY)",
        "Amazon FBA communities (Reddit, FB groups) — топ боль: листинги и CTR",
        "Helium10 оценивается в $500M+ — рынок огромный",
        "GPT-4 кач AI-copy до уровня профессионального копирайтера",
      ],
    },
    competitors: [
      { name: "Helium10", strengths: "Полный suite инструментов, большая база пользователей", weaknesses: "AI-фичи слабые, дорогой ($99+/мес), сложный UX", price: "$99-249/мес" },
      { name: "Jungle Scout", strengths: "Лучший keyword research, strong brand", weaknesses: "Нет AI-оптимизации листингов, фокус на аналитике", price: "$49-129/мес" },
      { name: "DataHawk", strengths: "Хорошая аналитика продаж", weaknesses: "Нет генерации контента, B2B-фокус", price: "$50-150/мес" },
    ],
    monetization: [
      { tier: "Starter", price: "$39/мес", features: ["10 листингов/мес", "Title + Bullets", "Keyword suggestions", "Email поддержка"] },
      { tier: "Pro", price: "$69/мес", features: ["50 листингов/мес", "Full listing rewrite", "A/B тестирование", "Competitor analysis", "Priority support"] },
      { tier: "Agency", price: "$149/мес", features: ["Unlimited листингов", "White-label отчёты", "API доступ", "Dedicated manager"] },
    ],
    risks: [
      "Amazon изменит алгоритм A9 и текущая стратегия оптимизации устареет",
      "Helium10 или Jungle Scout быстро внедрят AI-фичи с лучшим UX",
      "Высокий churn: продавцы оптимизируют листинги разово, не видят ценность в подписке",
      "Сложно доказать ROI — тяжело атрибутировать рост продаж именно оптимизации",
      "Нарушение ToS Amazon при автоматическом постинге листингов",
    ],
    nextSteps: [
      "Провести 20 custdev-интервью с Amazon FBA продавцами (r/FulfillmentByAmazon)",
      "Создать MVP: простая форма + GPT-4 + шаблон промпта для title/bullets",
      "Запустить на ProductHunt с lifetime deal ($199) для первых 100 пользователей",
      "Собрать 10 кейсов с измеримым ростом CTR/конверсии",
      "Построить onboarding и retention механики (weekly insights email)",
    ],
  },
}

// Default plan for ideas without specific data
function getDefaultPlan(idea: typeof ideas[0]) {
  return {
    audience: {
      who: idea.audience,
      size: `Большая и растущая аудитория в нише ${idea.tags[0]}`,
      pain: idea.description,
    },
    market: {
      whyNow: "Рынок готов к AI-решениям, конкуренты медленно адаптируются",
      signals: [
        "Растущий интерес к автоматизации и AI-инструментам",
        "Ниша недооценена крупными игроками",
        "Целевая аудитория активно ищет решение",
        "Технологии созрели для запуска MVP",
      ],
    },
    competitors: idea.competitors.map(name => ({
      name,
      strengths: "Устоявшийся бренд, большая база пользователей",
      weaknesses: "Устаревший UX, нет AI-функций, высокая цена",
      price: "$50-200/мес",
    })),
    monetization: [
      { tier: "Starter", price: idea.price.split("-")[0] || "$29/мес", features: ["Базовые функции", "5 проектов", "Email поддержка"] },
      { tier: "Pro", price: idea.price.split("-")[1] || "$79/мес", features: ["Все функции", "Unlimited проекты", "Priority поддержка", "API доступ"] },
    ],
    risks: [
      "Конкуренты быстро скопируют функциональность",
      "Сложность привлечения первых клиентов без трекшн",
      "Высокая стоимость привлечения (CAC) в нише",
      "Технические сложности при масштабировании",
    ],
    nextSteps: [
      "Провести 15-20 custdev-интервью с целевой аудиторией",
      "Создать landing page и собрать waitlist",
      "Разработать MVP за 2-3 недели",
      "Запустить beta с первыми 10 пользователями",
      "Итерировать на основе обратной связи",
    ],
  }
}

const sectionStyle = (borderColor = "var(--accent)"): React.CSSProperties => ({
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderLeft: `3px solid ${borderColor}`,
  borderRadius: 12,
  padding: 24,
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
})

export default function PlanPage() {
  const [selectedId, setSelectedId] = useState(1)
  const idea = ideas.find(i => i.id === selectedId) || ideas[0]
  const plan = planData[idea.id] || getDefaultPlan(idea)

  return (
    <div style={{display:"flex", gap:0, animation:"fadeIn 0.2s ease", minHeight:"calc(100vh - 64px)"}}>
      {/* Left sidebar */}
      <div style={{width:260, flexShrink:0, marginRight:32}}>
        <h2 style={{fontSize:13, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12, marginTop:4}}>Идеи</h2>
        <div style={{display:"flex", flexDirection:"column", gap:4}}>
          {ideas.map(i => (
            <button key={i.id} onClick={() => setSelectedId(i.id)} style={{
              display:"flex",
              alignItems:"center",
              justifyContent:"space-between",
              padding:"8px 12px",
              borderRadius:8,
              border:"none",
              borderLeft: i.id === selectedId ? "2px solid var(--accent)" : "2px solid transparent",
              background: i.id === selectedId ? "rgba(99,102,241,0.08)" : "transparent",
              color: i.id === selectedId ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize:12,
              fontWeight: i.id === selectedId ? 500 : 400,
              cursor:"pointer",
              textAlign:"left",
              transition:"all 0.15s",
              paddingLeft: i.id === selectedId ? 10 : 12,
            }}
            onMouseEnter={e => { if(i.id !== selectedId) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)" }}
            onMouseLeave={e => { if(i.id !== selectedId) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <span style={{flex:1, marginRight:8, lineHeight:1.4}}>{i.title}</span>
              <span style={{
                flexShrink:0,
                background: "var(--bg-elevated)",
                color:"var(--text-muted)",
                fontSize:10,
                padding:"1px 6px",
                borderRadius:4,
              }}>{i.score}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1, minWidth:0}}>
        {/* Page header */}
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6}}>Бизнес план</div>
          <h1 style={{fontSize:22, fontWeight:600, color:"var(--text-primary)", margin:0, letterSpacing:"-0.4px"}}>{idea.title}</h1>
          <div style={{display:"flex", gap:6, marginTop:8, flexWrap:"wrap"}}>
            {idea.tags.map(t => (
              <span key={t} style={{background:"var(--bg-elevated)", color:"var(--text-muted)", fontSize:11, padding:"2px 8px", borderRadius:999}}>{t}</span>
            ))}
          </div>
        </div>

        {/* 1. Overview */}
        <div style={sectionStyle()}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
            <BookOpen size={15} color="var(--accent)" />
            <h2 style={{fontSize:14, fontWeight:600, color:"var(--text-primary)", margin:0}}>Обзор</h2>
          </div>
          <p style={{fontSize:13, color:"var(--text-secondary)", lineHeight:1.7, margin:0}}>
            {idea.description}
          </p>
          <div style={{display:"flex", gap:24, marginTop:16}}>
            <div>
              <div style={{fontSize:11, color:"var(--text-muted)"}}>Цена</div>
              <div style={{fontSize:14, fontWeight:600, color:"var(--text-primary)", marginTop:2}}>{idea.price}</div>
            </div>
            <div>
              <div style={{fontSize:11, color:"var(--text-muted)"}}>Tier</div>
              <div style={{fontSize:14, fontWeight:600, color:"var(--accent)", marginTop:2}}>{idea.tier}</div>
            </div>
            <div>
              <div style={{fontSize:11, color:"var(--text-muted)"}}>Общий скор</div>
              <div style={{fontSize:14, fontWeight:600, color:"var(--text-primary)", marginTop:2}}>{idea.score}</div>
            </div>
          </div>
          <div style={{marginTop:16}}>
            <ScoreBar label="Рынок" value={idea.market} />
            <ScoreBar label="Боль" value={idea.pain} />
            <ScoreBar label="Монетизация" value={idea.mono} />
            <ScoreBar label="Скорость" value={idea.speed} />
            <ScoreBar label="Конкуренция" value={idea.competition} />
          </div>
        </div>

        {/* 2. Audience */}
        <div style={sectionStyle("#22C55E")}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
            <Users size={15} color="#22C55E" />
            <h2 style={{fontSize:14, fontWeight:600, color:"var(--text-primary)", margin:0}}>Аудитория</h2>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16}}>
            <div>
              <div style={{fontSize:11, color:"var(--text-muted)", marginBottom:4}}>Кто</div>
              <div style={{fontSize:12, color:"var(--text-secondary)", lineHeight:1.5}}>{plan.audience.who}</div>
            </div>
            <div>
              <div style={{fontSize:11, color:"var(--text-muted)", marginBottom:4}}>Размер</div>
              <div style={{fontSize:12, color:"var(--text-secondary)", lineHeight:1.5}}>{plan.audience.size}</div>
            </div>
            <div>
              <div style={{fontSize:11, color:"var(--text-muted)", marginBottom:4}}>Боль</div>
              <div style={{fontSize:12, color:"var(--text-secondary)", lineHeight:1.5}}>{plan.audience.pain}</div>
            </div>
          </div>
        </div>

        {/* 3. Market */}
        <div style={sectionStyle("#F59E0B")}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
            <TrendingUp size={15} color="#F59E0B" />
            <h2 style={{fontSize:14, fontWeight:600, color:"var(--text-primary)", margin:0}}>Анализ рынка</h2>
          </div>
          <p style={{fontSize:13, color:"var(--text-secondary)", lineHeight:1.7, marginTop:0, marginBottom:12}}>{plan.market.whyNow}</p>
          <div style={{display:"flex", flexDirection:"column", gap:6}}>
            {plan.market.signals.map((s, i) => (
              <div key={i} style={{display:"flex", gap:8, alignItems:"flex-start"}}>
                <span style={{color:"var(--warning)", marginTop:1, flexShrink:0}}>→</span>
                <span style={{fontSize:12, color:"var(--text-secondary)"}}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Competitors */}
        <div style={sectionStyle("#EF4444")}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
            <BarChart2 size={15} color="#EF4444" />
            <h2 style={{fontSize:14, fontWeight:600, color:"var(--text-primary)", margin:0}}>Конкуренты</h2>
          </div>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr>
                {["Название", "Сильные стороны", "Слабые стороны", "Цена"].map(h => (
                  <th key={h} style={{fontSize:11, color:"var(--text-muted)", fontWeight:500, textAlign:"left", padding:"0 12px 8px 0", borderBottom:"1px solid var(--border)"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.competitors.map((c, i) => (
                <tr key={i}>
                  <td style={{fontSize:12, fontWeight:600, color:"var(--text-primary)", padding:"10px 12px 10px 0", borderBottom:"1px solid var(--border)", whiteSpace:"nowrap"}}>{c.name}</td>
                  <td style={{fontSize:11, color:"var(--text-secondary)", padding:"10px 12px 10px 0", borderBottom:"1px solid var(--border)"}}>{c.strengths}</td>
                  <td style={{fontSize:11, color:"var(--text-secondary)", padding:"10px 12px 10px 0", borderBottom:"1px solid var(--border)"}}>{c.weaknesses}</td>
                  <td style={{fontSize:11, color:"var(--text-secondary)", padding:"10px 0", borderBottom:"1px solid var(--border)", whiteSpace:"nowrap"}}>{c.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. Monetization */}
        <div style={sectionStyle("#8B5CF6")}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
            <DollarSign size={15} color="#8B5CF6" />
            <h2 style={{fontSize:14, fontWeight:600, color:"var(--text-primary)", margin:0}}>Монетизация</h2>
          </div>
          <div style={{display:"grid", gridTemplateColumns:`repeat(${plan.monetization.length}, 1fr)`, gap:12}}>
            {plan.monetization.map((m, i) => (
              <div key={i} style={{
                background:"var(--bg-elevated)",
                border:"1px solid var(--border)",
                borderRadius:10,
                padding:16,
              }}>
                <div style={{fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginBottom:4}}>{m.tier}</div>
                <div style={{fontSize:20, fontWeight:700, color:"var(--text-primary)", marginBottom:12}}>{m.price}</div>
                <div style={{display:"flex", flexDirection:"column", gap:4}}>
                  {m.features.map((f, j) => (
                    <div key={j} style={{fontSize:11, color:"var(--text-secondary)", display:"flex", gap:6}}>
                      <span style={{color:"var(--success)"}}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Risks */}
        <div style={sectionStyle("#F59E0B")}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
            <AlertTriangle size={15} color="#F59E0B" />
            <h2 style={{fontSize:14, fontWeight:600, color:"var(--text-primary)", margin:0}}>Риски</h2>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {plan.risks.map((r, i) => (
              <div key={i} style={{display:"flex", gap:10, alignItems:"flex-start"}}>
                <span style={{
                  background:"rgba(245,158,11,0.15)",
                  color:"var(--warning)",
                  fontSize:10,
                  fontWeight:700,
                  padding:"1px 6px",
                  borderRadius:4,
                  flexShrink:0,
                  marginTop:1,
                }}>R{i+1}</span>
                <span style={{fontSize:12, color:"var(--text-secondary)", lineHeight:1.5}}>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Next Steps */}
        <div style={sectionStyle("#22C55E")}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
            <CheckSquare size={15} color="#22C55E" />
            <h2 style={{fontSize:14, fontWeight:600, color:"var(--text-primary)", margin:0}}>Следующие шаги</h2>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {plan.nextSteps.map((s, i) => (
              <div key={i} style={{display:"flex", gap:12, alignItems:"flex-start"}}>
                <span style={{
                  width:22,
                  height:22,
                  borderRadius:"50%",
                  background:"rgba(34,197,94,0.15)",
                  color:"var(--success)",
                  fontSize:11,
                  fontWeight:700,
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  flexShrink:0,
                }}>{i+1}</span>
                <span style={{fontSize:13, color:"var(--text-secondary)", lineHeight:1.5, paddingTop:2}}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
