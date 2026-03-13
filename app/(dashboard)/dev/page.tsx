"use client"
import { CheckSquare, Square, Github, TrendingUp } from "lucide-react"

const tasks = [
  { done: true, label: "Исследование конкурентов" },
  { done: true, label: "Описание продукта" },
  { done: false, label: "Лендинг страница" },
  { done: false, label: "MVP разработка" },
  { done: false, label: "Первые 10 клиентов" },
  { done: false, label: "Product Hunt запуск" },
]

const metrics = [
  { label: "MRR", value: "$0", sub: "Ежемесячная выручка" },
  { label: "Users", value: "0", sub: "Активных пользователей" },
  { label: "Signups", value: "0", sub: "Регистраций" },
]

const stack = ["Next.js", "TypeScript", "Supabase", "Stripe"]

export default function DevPage() {
  return (
    <div style={{animation:"fadeIn 0.2s ease"}}>
      {/* Header */}
      <div style={{marginBottom:32}}>
        <h1 style={{fontSize:24, fontWeight:600, color:"var(--text-primary)", margin:0, letterSpacing:"-0.5px"}}>Разработка</h1>
        <p style={{fontSize:13, color:"var(--text-muted)", marginTop:4}}>Текущий статус проекта</p>
      </div>

      {/* 3-column grid */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:20}}>

        {/* Card 1: Current project */}
        <div style={{
          background:"var(--bg-surface)",
          border:"1px solid var(--border)",
          borderRadius:12,
          padding:24,
          boxShadow:"0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        }}>
          <div style={{fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16}}>Текущий проект</div>

          <div style={{fontSize:16, fontWeight:600, color:"var(--text-primary)", marginBottom:8}}>Amazon Listing Optimizer</div>
          <span style={{
            background:"rgba(99,102,241,0.2)",
            color:"#818CF8",
            fontSize:11,
            fontWeight:600,
            padding:"2px 10px",
            borderRadius:6,
            display:"inline-block",
            marginBottom:20,
          }}>Идея</span>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:11, color:"var(--text-muted)", marginBottom:8}}>Tech Stack</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
              {stack.map(t => (
                <span key={t} style={{
                  background:"var(--bg-elevated)",
                  border:"1px solid var(--border)",
                  color:"var(--text-secondary)",
                  fontSize:11,
                  padding:"3px 10px",
                  borderRadius:6,
                }}>{t}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={{fontSize:11, color:"var(--text-muted)", marginBottom:8}}>GitHub</div>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <div style={{display:"flex", alignItems:"center", gap:6, color:"var(--text-muted)", fontSize:12}}>
                <Github size={13} />
                Не создан
              </div>
              <button style={{
                background:"var(--bg-elevated)",
                border:"1px solid var(--border)",
                borderRadius:8,
                padding:"4px 12px",
                color:"var(--text-secondary)",
                fontSize:11,
                cursor:"pointer",
                fontFamily:"inherit",
                transition:"all 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)" }}
              >
                + Создать репозиторий
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Metrics */}
        <div style={{
          background:"var(--bg-surface)",
          border:"1px solid var(--border)",
          borderRadius:12,
          padding:24,
          boxShadow:"0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        }}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:20}}>
            <TrendingUp size={14} color="var(--accent)" />
            <div style={{fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em"}}>Метрики</div>
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:12, marginBottom:20}}>
            {metrics.map(m => (
              <div key={m.label} style={{
                display:"flex",
                alignItems:"center",
                justifyContent:"space-between",
                padding:"10px 14px",
                background:"var(--bg-elevated)",
                borderRadius:8,
              }}>
                <div>
                  <div style={{fontSize:11, color:"var(--text-muted)"}}>{m.sub}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11, color:"var(--text-muted)", marginBottom:1}}>{m.label}</div>
                  <div style={{fontSize:18, fontWeight:700, color:"var(--text-primary)"}}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding:"10px 14px",
            background:"rgba(99,102,241,0.05)",
            border:"1px solid rgba(99,102,241,0.15)",
            borderRadius:8,
            fontSize:12,
            color:"var(--text-muted)",
            textAlign:"center",
          }}>
            Данные появятся после запуска
          </div>
        </div>

        {/* Card 3: Tasks */}
        <div style={{
          background:"var(--bg-surface)",
          border:"1px solid var(--border)",
          borderRadius:12,
          padding:24,
          boxShadow:"0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        }}>
          <div style={{fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16}}>Задачи</div>

          <div style={{display:"flex", flexDirection:"column", gap:6}}>
            {tasks.map((t, i) => (
              <div key={i} style={{
                display:"flex",
                alignItems:"center",
                gap:10,
                padding:"8px 10px",
                borderRadius:8,
                background: t.done ? "rgba(34,197,94,0.05)" : "transparent",
                transition:"background 0.15s",
              }}>
                {t.done
                  ? <CheckSquare size={14} color="var(--success)" />
                  : <Square size={14} color="var(--text-muted)" />
                }
                <span style={{
                  fontSize:13,
                  color: t.done ? "var(--text-secondary)" : "var(--text-primary)",
                  textDecoration: t.done ? "line-through" : "none",
                }}>{t.label}</span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop:20,
            padding:"8px 12px",
            background:"var(--bg-elevated)",
            borderRadius:8,
            fontSize:11,
            color:"var(--text-muted)",
            display:"flex",
            justifyContent:"space-between",
          }}>
            <span>Прогресс</span>
            <span>{tasks.filter(t => t.done).length} / {tasks.length} выполнено</span>
          </div>
        </div>
      </div>
    </div>
  )
}
