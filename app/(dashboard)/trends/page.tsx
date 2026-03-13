"use client"
import { trends } from "@/lib/data"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

const sourceBadgeColors: Record<string, { bg: string; color: string }> = {
  Reddit: { bg: "rgba(249,115,22,0.15)", color: "#FB923C" },
  HackerNews: { bg: "rgba(245,158,11,0.15)", color: "#FCD34D" },
  ProductHunt: { bg: "rgba(244,63,94,0.15)", color: "#FB7185" },
}

function SourceBadge({ source }: { source: string }) {
  const style = sourceBadgeColors[source] || { bg: "var(--bg-elevated)", color: "var(--text-muted)" }
  return (
    <span style={{
      background: style.bg,
      color: style.color,
      fontSize: 11,
      fontWeight: 500,
      padding: "2px 8px",
      borderRadius: 999,
    }}>{source}</span>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background:"var(--bg-elevated)",
        border:"1px solid var(--border)",
        borderRadius:8,
        padding:"8px 12px",
        fontSize:12,
        color:"var(--text-primary)",
      }}>
        <div style={{color:"var(--text-muted)", marginBottom:2}}>{label}</div>
        <div style={{fontWeight:600}}>{payload[0].value} упоминаний</div>
      </div>
    )
  }
  return null
}

export default function TrendsPage() {
  return (
    <div style={{animation:"fadeIn 0.2s ease"}}>
      {/* Header */}
      <div style={{marginBottom:32}}>
        <h1 style={{fontSize:24, fontWeight:600, color:"var(--text-primary)", margin:0, letterSpacing:"-0.5px"}}>Тренды</h1>
        <p style={{fontSize:13, color:"var(--text-muted)", marginTop:4}}>Данные за последние 7 дней</p>
      </div>

      {/* Chart */}
      <div style={{
        background:"var(--bg-surface)",
        border:"1px solid var(--border)",
        borderRadius:12,
        padding:24,
        marginBottom:28,
        boxShadow:"0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
      }}>
        <div style={{fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:20}}>Упоминания по ключевым словам</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trends} margin={{top:0, right:0, left:-10, bottom:60}}>
            <CartesianGrid stroke="#1E1E30" vertical={false} />
            <XAxis
              dataKey="keyword"
              tick={{fill:"#525472", fontSize:11}}
              angle={-35}
              textAnchor="end"
              interval={0}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{fill:"#525472", fontSize:11}}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill:"rgba(99,102,241,0.05)"}} />
            <Bar dataKey="mentions" fill="#6366F1" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div style={{
        background:"var(--bg-surface)",
        border:"1px solid var(--border)",
        borderRadius:12,
        overflow:"hidden",
        boxShadow:"0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
      }}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid var(--border)"}}>
              {["Ключевое слово", "Источник", "Упоминания", "Изменение"].map(h => (
                <th key={h} style={{
                  fontSize:11,
                  color:"var(--text-muted)",
                  fontWeight:500,
                  textAlign:"left",
                  padding:"12px 20px",
                  textTransform:"uppercase",
                  letterSpacing:"0.06em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trends.map((t, i) => (
              <tr key={i} style={{borderBottom: i < trends.length - 1 ? "1px solid var(--border)" : "none"}}>
                <td style={{padding:"12px 20px", fontSize:13, color:"var(--text-primary)", fontWeight:500}}>{t.keyword}</td>
                <td style={{padding:"12px 20px"}}><SourceBadge source={t.source} /></td>
                <td style={{padding:"12px 20px", fontSize:13, color:"var(--text-secondary)", fontWeight:600}}>{t.mentions.toLocaleString()}</td>
                <td style={{padding:"12px 20px"}}>
                  <span style={{
                    fontSize:12,
                    fontWeight:600,
                    color: t.change >= 0 ? "var(--success)" : "var(--danger)",
                    background: t.change >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    padding:"2px 8px",
                    borderRadius:6,
                  }}>
                    {t.change >= 0 ? "+" : ""}{t.change}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
