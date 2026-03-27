"use client"

import { useState, useEffect } from "react"
import { DndContext, DragOverlay, useDroppable, useDraggable, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { ExternalLink, ArrowRight, GripVertical, Plus, Trash2 } from "lucide-react"
import {
  companyProjects,
  stageLabel,
  stageColor,
  stageEmoji,
  type CompanyProject,
  type CompanyProjectStage,
} from "@/lib/company-projects"
import { Modal, fieldStyle, labelStyle, fieldGroupStyle, SubmitButton } from "@/components/modal"
import { ProjectDetailPanel } from "@/components/detail-panel"
import { MetricCard } from "@/components/metric-card"
import { logHistory } from "@/lib/history"

const STAGES_KEY = "ailnex_project_stages"
const CUSTOM_KEY = "ailnex_custom_projects"
const COLUMNS: CompanyProjectStage[] = ["idea", "building", "launched"]

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

function loadStages(): Record<string, CompanyProjectStage> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(STAGES_KEY) || "{}") } catch { return {} }
}

function loadCustomProjects(): CompanyProject[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]") } catch { return [] }
}

function saveStages(s: Record<string, CompanyProjectStage>) {
  localStorage.setItem(STAGES_KEY, JSON.stringify(s))
}

function saveCustomProjects(p: CompanyProject[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(p))
}

// ─── Add Project Modal ────────────────────────────────────────────────────────

function AddProjectModal({ onAdd, onClose }: {
  onAdd: (p: CompanyProject) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: "", description: "", stage: "idea" as CompanyProjectStage,
    url: "", tags: "", nextStep: "",
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onAdd({
      id: `custom-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      stage: form.stage,
      url: form.url.trim() || undefined,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      nextStep: form.nextStep.trim() || undefined,
    })
    onClose()
  }

  return (
    <Modal title="Новый проект" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Название *</label>
          <input style={fieldStyle} value={form.title} onChange={e => set("title", e.target.value)}
            placeholder="Название проекта" autoFocus
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Описание</label>
          <textarea style={{ ...fieldStyle, resize: "vertical", minHeight: 72 }}
            value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Что за проект?"
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Статус</label>
          <select style={{ ...fieldStyle, cursor: "pointer" }}
            value={form.stage} onChange={e => set("stage", e.target.value)}
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}>
            {COLUMNS.map(s => <option key={s} value={s}>{stageEmoji[s]} {stageLabel[s]}</option>)}
          </select>
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>URL (опционально)</label>
          <input style={fieldStyle} value={form.url} onChange={e => set("url", e.target.value)}
            placeholder="https://..."
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Теги (через запятую)</label>
          <input style={fieldStyle} value={form.tags} onChange={e => set("tags", e.target.value)}
            placeholder="SaaS, AI, B2B"
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Следующий шаг</label>
          <input style={fieldStyle} value={form.nextStep} onChange={e => set("nextStep", e.target.value)}
            placeholder="Что нужно сделать дальше?"
            onFocus={e => (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"} />
        </div>
        <SubmitButton label="Добавить проект" />
      </form>
    </Modal>
  )
}

// ─── Card Content ─────────────────────────────────────────────────────────────

function CardContent({
  project,
  color,
  dragHandleProps,
  isOverlay,
  onDelete,
  onOpen,
}: {
  project: CompanyProject
  color: string
  dragHandleProps?: Record<string, unknown>
  isOverlay?: boolean
  onDelete?: () => void
  onOpen?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={!isOverlay ? onOpen : undefined}
      style={{
        background: isOverlay ? "var(--bg-elevated)" : "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 9,
        boxShadow: isOverlay ? "0 8px 24px rgba(0,0,0,0.5)" : "none",
        cursor: isOverlay ? "grabbing" : onOpen ? "pointer" : "default",
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Delete button (custom projects only) */}
      {onDelete && hovered && !isOverlay && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            position: "absolute", top: 10, right: 10,
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "3px 6px", cursor: "pointer",
            color: "var(--danger)", lineHeight: 1, zIndex: 1,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"}
        >
          <Trash2 size={12} />
        </button>
      )}

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, paddingRight: onDelete ? 24 : 0 }}>
        <div
          {...dragHandleProps}
          onClick={e => e.stopPropagation()}
          style={{ cursor: "grab", color: "var(--text-muted)", flexShrink: 0, marginTop: 1, padding: "1px 0", opacity: 0.5, transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.5"}
        >
          <GripVertical size={14} />
        </div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
          {project.title}
        </div>
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: "var(--text-muted)", flexShrink: 0, lineHeight: 1, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {project.description && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {project.description}
        </div>
      )}

      {project.tags.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {project.tags.map(tag => (
            <span key={tag} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{tag}</span>
          ))}
        </div>
      )}

      {project.nextStep && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "7px 9px", borderRadius: 7, background: `${color}10`, border: `1px solid ${color}25` }}>
          <ArrowRight size={11} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.45 }}>{project.nextStep}</span>
        </div>
      )}
    </div>
  )
}

// ─── Draggable Card ───────────────────────────────────────────────────────────

function DraggableCard({ project, isDragging, onDelete, onOpen }: {
  project: CompanyProject
  isDragging?: boolean
  onDelete?: () => void
  onOpen?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: project.id })
  const color = stageColor[project.stage]

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }}>
      <CardContent project={project} color={color} dragHandleProps={{ ...attributes, ...listeners }} onDelete={onDelete} onOpen={onOpen} />
    </div>
  )
}

// ─── Droppable Column ─────────────────────────────────────────────────────────

function DroppableColumn({ stage, projects, activeId, onDelete, onOpen }: {
  stage: CompanyProjectStage
  projects: CompanyProject[]
  activeId: string | null
  onDelete: (id: string) => void
  onOpen: (p: CompanyProject) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const color = stageColor[stage]

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: `${color}12`, border: `1px solid ${color}25` }}>
        <span style={{ fontSize: 13 }}>{stageEmoji[stage]}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.2px" }}>{stageLabel[stage]}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: 10 }}>
          {projects.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 80, borderRadius: 10, padding: 4, border: isOver ? `2px dashed ${color}` : "2px solid transparent", background: isOver ? `${color}08` : "transparent", transition: "all 0.15s" }}>
        {projects.map(project => (
          <DraggableCard
            key={project.id}
            project={project}
            isDragging={project.id === activeId}
            onDelete={project.id.startsWith("custom-") ? () => onDelete(project.id) : undefined}
            onOpen={() => onOpen(project)}
          />
        ))}
        {projects.length === 0 && !isOver && (
          <div style={{ padding: "20px 14px", borderRadius: 10, border: "1px dashed var(--border)", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
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
  const [customProjects, setCustomProjects] = useState<CompanyProject[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [detailProject, setDetailProject] = useState<CompanyProject | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setStageOverrides(loadStages())
    setCustomProjects(loadCustomProjects())
    setMounted(true)
  }, [])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const allProjects = [
    ...companyProjects.filter(p => !p.archived),
    ...customProjects,
  ].map(p => ({ ...p, stage: (stageOverrides[p.id] ?? p.stage) as CompanyProjectStage }))

  const activeProject = allProjects.find(p => p.id === activeId) ?? null

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const newStage = over.id as CompanyProjectStage
    if (!COLUMNS.includes(newStage)) return
    const prev = allProjects.find(p => p.id === active.id)
    const updated = { ...stageOverrides, [active.id]: newStage }
    setStageOverrides(updated)
    saveStages(updated)
    if (prev && prev.stage !== newStage) {
      logHistory({ action: "moved", itemType: "project", itemTitle: prev.title, from: stageLabel[prev.stage], to: stageLabel[newStage] })
    }
  }

  function handleAdd(p: CompanyProject) {
    const updated = [...customProjects, p]
    setCustomProjects(updated)
    saveCustomProjects(updated)
    logHistory({ action: "added", itemType: "project", itemTitle: p.title, to: stageLabel[p.stage] })
  }

  function handleDelete(id: string) {
    const proj = customProjects.find(p => p.id === id)
    const updated = customProjects.filter(p => p.id !== id)
    setCustomProjects(updated)
    saveCustomProjects(updated)
    const overrides = { ...stageOverrides }
    delete overrides[id]
    setStageOverrides(overrides)
    saveStages(overrides)
    if (proj) logHistory({ action: "deleted", itemType: "project", itemTitle: proj.title })
  }

  if (!mounted) return null

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
            Ailnex — Доска проектов
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
            {allProjects.length} проектов · перетащи карточку чтобы изменить статус
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
        >
          <Plus size={14} /> Проект
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <MetricCard emoji="🛠" value={allProjects.filter(p => p.stage === "building").length} label="В разработке" color="#6366F1" />
        <MetricCard emoji="🚀" value={allProjects.filter(p => p.stage === "launched").length} label="Запущено" color="#22C55E" />
        <MetricCard emoji="📦" value={allProjects.length} label="Всего активных" color="var(--text-secondary)" />
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {COLUMNS.map(stage => (
            <DroppableColumn
              key={stage}
              stage={stage}
              projects={allProjects.filter(p => p.stage === stage)}
              activeId={activeId}
              onDelete={handleDelete}
              onOpen={setDetailProject}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProject && (
            <CardContent project={activeProject} color={stageColor[activeProject.stage]} isOverlay />
          )}
        </DragOverlay>
      </DndContext>

      {showModal && <AddProjectModal onAdd={handleAdd} onClose={() => setShowModal(false)} />}
      {detailProject && <ProjectDetailPanel project={detailProject} onClose={() => setDetailProject(null)} />}
    </div>
  )
}
