"use client"

import { ExternalLink, ArrowRight } from "lucide-react"
import {
  companyProjects,
  stageLabel,
  stageColor,
  stageEmoji,
  type CompanyProject,
} from "@/lib/company-projects"

const archived = companyProjects.filter(p => p.archived)

function ArchivedCard({ project }: { project: CompanyProject }) {
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
      opacity: 0.75,
      transition: "opacity 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.75"}
    >
      {/* Stage badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13 }}>{stageEmoji[project.stage]}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "0.2px" }}>
          {stageLabel[project.stage]}
        </span>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: "auto", color: "var(--text-muted)", lineHeight: 1, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
        {project.title}
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
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
          background: `${color}10`, border: `1px solid ${color}25`,
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

export default function ArchivedProjectsPage() {
  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 600,
          color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px",
        }}>
          Архив проектов
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
          {archived.length} проектов · заморожены или отложены
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {archived.map(project => (
          <ArchivedCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
