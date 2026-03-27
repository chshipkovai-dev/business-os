"use client"

import { useState, useEffect } from "react"
import { DndContext, DragOverlay, useDroppable, useDraggable, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { ExternalLink, ArrowRight, GripVertical } from "lucide-react"
import {
  companyProjects,
  stageLabel,
  stageColor,
  stageEmoji,
  type CompanyProject,
  type CompanyProjectStage,
} from "@/lib/company-projects"

const STAGES_KEY = "ailnex_project_stages"
const COLUMNS: CompanyProjectStage[] = ["idea", "building", "launched"]

function loadStages(): Record<string, CompanyProjectStage> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STAGES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStages(stages: Record<string, CompanyProjectStage>) {
  localStorage.setItem(STAGES_KEY, JSON.stringify(stages))
}

// ─── Draggable Card ──────────────────────────────────────────────────────────

function DraggableCard({ project, isDragging }: { project: CompanyProject; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: project.id })
  const color = stageColor[project.stage]

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <CardContent project={project} dragHandleProps={{ ...attributes, ...listeners }} color={color} />
    </div>
  )
}

function CardContent({
  project,
  color,
  dragHandleProps,
  isOverlay,
}: {
  project: CompanyProject
  color: string
  dragHandleProps?: Record<string, unknown>
  isOverlay?: boolean
}) {
  return (
    <div style={{
      background: isOverlay ? "var(--bg-elevated)" : "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 9,
      boxShadow: isOverlay ? "0 8px 24px rgba(0,0,0,0.5)" : "none",
      cursor: isOverlay ? "grabbing" : "default",
    }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          style={{
            cursor: "grab", color: "var(--text-muted)", flexShrink: 0,
            marginTop: 1, padding: "1px 0",
            opacity: 0.5, transition: "opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.5"}
        >
          <GripVertical size={14} />
        </div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
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
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
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
          padding: "7px 9px", borderRadius: 7,
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

// ─── Droppable Column ─────────────────────────────────────────────────────────

function DroppableColumn({
  stage,
  projects,
  activeId,
}: {
  stage: CompanyProjectStage
  projects: CompanyProject[]
  activeId: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const color = stageColor[stage]

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", borderRadius: 8,
        background: `${color}12`, border: `1px solid ${color}25`,
      }}>
        <span style={{ fontSize: 13 }}>{stageEmoji[stage]}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.2px" }}>
          {stageLabel[stage]}
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 600,
          color: "var(--text-muted)", background: "var(--bg-elevated)",
          padding: "1px 6px", borderRadius: 10,
        }}>
          {projects.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          display: "flex", flexDirection: "column", gap: 8,
          minHeight: 80, borderRadius: 10, padding: 4,
          border: isOver ? `2px dashed ${color}` : "2px solid transparent",
          background: isOver ? `${color}08` : "transparent",
          transition: "all 0.15s",
        }}
      >
        {projects.map(project => (
          <DraggableCard
            key={project.id}
            project={project}
            isDragging={project.id === activeId}
          />
        ))}
        {projects.length === 0 && !isOver && (
          <div style={{
            padding: "20px 14px", borderRadius: 10,
            border: "1px dashed var(--border)",
            textAlign: "center", fontSize: 12, color: "var(--text-muted)",
          }}>
            Перетащи сюда
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Board ────────────────────────────────────────────────────────────────────

export default function CompanyBoard() {
  const [stageOverrides, setStageOverrides] = useState<Record<string, CompanyProjectStage>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setStageOverrides(loadStages())
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const activeProjects = companyProjects
    .filter(p => !p.archived)
    .map(p => ({
      ...p,
      stage: (stageOverrides[p.id] ?? p.stage) as CompanyProjectStage,
    }))

  const activeProject = activeProjects.find(p => p.id === activeId) ?? null

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const newStage = over.id as CompanyProjectStage
    if (!COLUMNS.includes(newStage)) return
    const updated = { ...stageOverrides, [active.id]: newStage }
    setStageOverrides(updated)
    saveStages(updated)
  }

  if (!mounted) return null

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 600,
          color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px",
        }}>
          Ailnex — Доска проектов
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
          {activeProjects.length} проектов · перетащи карточку чтобы изменить статус
        </p>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {COLUMNS.map(stage => (
            <DroppableColumn
              key={stage}
              stage={stage}
              projects={activeProjects.filter(p => p.stage === stage)}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProject && (
            <CardContent
              project={activeProject}
              color={stageColor[activeProject.stage]}
              isOverlay
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
