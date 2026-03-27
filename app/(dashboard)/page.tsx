"use client"

import { ExternalLink, ArrowRight } from "lucide-react"
import {
  companyProjects,
  stageLabel,
  stageColor,
  stageEmoji,
  type CompanyProject,
  type CompanyProjectStage,
} from "@/lib/company-projects"

const columns: { stage: CompanyProjectStage }[] = [
  { stage: "idea" },
  { stage: "building" },
  { stage: "launched" },
  { stage: "frozen" },
]

function ProjectCard({ project }: { project: CompanyProject }) {
  const color = stageColor[project.stage]

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      transition: "all 0.15s",
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = "var(--bg-elevated)"
        el.style.borderColor = color
        el.style.borderLeftColor = color
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = "var(--bg-surface)"
        el.style.borderColor = "var(--border)"
        el.style.borderLeftColor = color
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
          {project.title}
        </div>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: "var(--text-muted)", flexShrink: 0, lineHeight: 1, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12,
        color: "var(--text-secondary)",
        lineHeight: 1.5,
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {project.description}
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {project.tags.map(tag => (
          <span key={tag} style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 20,
            background: "var(--bg-elevated)", color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}>{tag}</span>
        ))}
      </div>

      {/* Next step */}
      {project.nextStep && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 6,
          padding: "8px 10px", borderRadius: 7,
          background: `${color}10`,
          border: `1px solid ${color}25`,
        }}>
          <ArrowRight size={11} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.45 }}>
            {project.nextStep}
          </span>
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ stage }: { stage: CompanyProjectStage }) {
  const color = stageColor[stage]
  const emoji = stageEmoji[stage]
  const label = stageLabel[stage]
  const items = companyProjects.filter(p => p.stage === stage && !p.archived)

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Column header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", borderRadius: 8,
        background: `${color}12`,
        border: `1px solid ${color}25`,
      }}>
        <span style={{ fontSize: 13 }}>{emoji}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.2px" }}>
          {label}
        </span>
        <span style={{
          marginLeft: "auto",
          fontSize: 11, fontWeight: 600,
          color: "var(--text-muted)",
          background: "var(--bg-elevated)",
          padding: "1px 6px", borderRadius: 10,
        }}>
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {items.length === 0 && (
          <div style={{
            padding: "20px 14px", borderRadius: 10,
            border: "1px dashed var(--border)",
            textAlign: "center",
            fontSize: 12, color: "var(--text-muted)",
          }}>
            Нет проектов
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompanyBoard() {
  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 600,
          color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px",
        }}>
          Ailnex — Доска проектов
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
          {companyProjects.filter(p => !p.archived).length} проектов · статус в реальном времени
        </p>
      </div>

      {/* Kanban */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {columns.map(({ stage }) => (
          <KanbanColumn key={stage} stage={stage} />
        ))}
      </div>
    </div>
  )
}
