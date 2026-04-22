"use client"

import { useState, useEffect } from "react"
import { DndContext, DragOverlay, useDroppable, useDraggable, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { ExternalLink, ArrowRight, GripVertical, Plus, Trash2 } from "lucide-react"
import { stageColor, type CompanyProjectStage } from "@/lib/company-projects"
import { Modal, fieldStyle, labelStyle, fieldGroupStyle, SubmitButton } from "@/components/modal"
import { ProjectDetailPanel } from "@/components/detail-panel"
import { MetricCard } from "@/components/metric-card"
import { logHistory } from "@/lib/history"
import { useLang } from "@/lib/lang"
import { t } from "@/lib/translations"

const COLUMNS: CompanyProjectStage[] = ["idea", "building", "launched"]

interface DBProject {
  id: string
  title: string
  description: string
  stage: CompanyProjectStage
  url?: string | null
  next_step?: string | null
  tags: string[]
  archived: boolean
}

// ─── Project Form Modal ───────────────────────────────────────────────────────

function ProjectFormModal({ initial, onSave, onClose }: {
  initial?: DBProject
  onSave: (p: Partial<DBProject>) => void
  onClose: () => void
}) {
  const { lang } = useLang()
  const b = t.board
  const stageLabels: Record<CompanyProjectStage, string> = {
    idea: b.idea[lang], building: b.building[lang], launched: b.launchedStage[lang],
  }
  const stageEmojis: Record<CompanyProjectStage, string> = { idea: "💡", building: "🛠", launched: "🚀" }

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    stage: initial?.stage ?? "idea" as CompanyProjectStage,
    url: initial?.url ?? "",
    tags: (initial?.tags ?? []).join(", "),
    next_step: initial?.next_step ?? "",
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      stage: form.stage,
      url: form.url.trim() || null,
      tags: form.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      next_step: form.next_step.trim() || null,
    })
    onClose()
  }

  const fo = (e: React.FocusEvent) => (e.target as HTMLElement).style.borderColor = "rgba(0,229,255,0.4)"
  const bl = (e: React.FocusEvent) => (e.target as HTMLElement).style.borderColor = "var(--border)"

  return (
    <Modal title={initial ? b.editProject[lang] : b.newProjectTitle[lang]} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{b.name[lang]}</label>
          <input style={fieldStyle} value={form.title} onChange={e => set("title", e.target.value)}
            placeholder={b.namePlaceholder[lang]} autoFocus onFocus={fo} onBlur={bl} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{b.description[lang]}</label>
          <textarea style={{ ...fieldStyle, resize: "vertical", minHeight: 72 }}
            value={form.description} onChange={e => set("description", e.target.value)}
            placeholder={b.descriptionPlaceholder[lang]} onFocus={fo} onBlur={bl} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{b.status[lang]}</label>
          <select style={{ ...fieldStyle, cursor: "pointer" }} value={form.stage}
            onChange={e => set("stage", e.target.value)} onFocus={fo} onBlur={bl}>
            {COLUMNS.map(s => <option key={s} value={s}>{stageEmojis[s]} {stageLabels[s]}</option>)}
          </select>
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{b.urlLabel[lang]}</label>
          <input style={fieldStyle} value={form.url ?? ""} onChange={e => set("url", e.target.value)}
            placeholder={b.urlPlaceholder[lang]} onFocus={fo} onBlur={bl} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{b.tags[lang]}</label>
          <input style={fieldStyle} value={form.tags} onChange={e => set("tags", e.target.value)}
            placeholder={b.tagsPlaceholder[lang]} onFocus={fo} onBlur={bl} />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>{b.nextStep[lang]}</label>
          <input style={fieldStyle} value={form.next_step ?? ""} onChange={e => set("next_step", e.target.value)}
            placeholder={b.nextStepPlaceholder[lang]} onFocus={fo} onBlur={bl} />
        </div>
        <SubmitButton label={initial ? b.saveBtn[lang] : b.addBtn[lang]} />
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
  project: DBProject
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

      {project.next_step && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "7px 9px", borderRadius: 7, background: `${color}10`, border: `1px solid ${color}25` }}>
          <ArrowRight size={11} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.45 }}>{project.next_step}</span>
        </div>
      )}
    </div>
  )
}

// ─── Draggable Card ───────────────────────────────────────────────────────────

function DraggableCard({ project, isDragging, onDelete, onOpen }: {
  project: DBProject
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
  projects: DBProject[]
  activeId: string | null
  onDelete: (id: string) => void
  onOpen: (p: DBProject) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const { lang } = useLang()
  const color = stageColor[stage]
  const stageLabels: Record<CompanyProjectStage, string> = {
    idea: t.board.idea[lang], building: t.board.building[lang], launched: t.board.launchedStage[lang],
  }
  const stageEmojis: Record<CompanyProjectStage, string> = { idea: "💡", building: "🛠", launched: "🚀" }

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: `${color}12`, border: `1px solid ${color}25` }}>
        <span style={{ fontSize: 13 }}>{stageEmojis[stage]}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "0.2px" }}>{stageLabels[stage]}</span>
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
            onDelete={() => onDelete(project.id)}
            onOpen={() => onOpen(project)}
          />
        ))}
        {projects.length === 0 && !isOver && (
          <div style={{ padding: "20px 14px", borderRadius: 10, border: "1px dashed var(--border)", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
            {t.board.dragHere[lang]}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Board ────────────────────────────────────────────────────────────────────

export default function CompanyBoard() {
  const [projects, setProjects] = useState<DBProject[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState<DBProject | null>(null)
  const [detailProject, setDetailProject] = useState<DBProject | null>(null)
  const { lang } = useLang()
  const b = t.board

  const stageLabels: Record<CompanyProjectStage, string> = {
    idea: b.idea[lang], building: b.building[lang], launched: b.launchedStage[lang],
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: DBProject[]) => {
        setProjects((data || []).filter(p => !p.archived))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const activeProject = projects.find(p => p.id === activeId) ?? null

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const newStage = over.id as CompanyProjectStage
    if (!COLUMNS.includes(newStage)) return
    const prev = projects.find(p => p.id === active.id)
    if (!prev || prev.stage === newStage) return

    setProjects(ps => ps.map(p => p.id === active.id ? { ...p, stage: newStage } : p))
    await fetch(`/api/projects?id=${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
    logHistory({ action: "moved", itemType: "project", itemTitle: prev.title, from: stageLabels[prev.stage], to: stageLabels[newStage] })
  }

  async function handleAdd(data: Partial<DBProject>) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.project) {
      setProjects(ps => [...ps, json.project])
      logHistory({ action: "added", itemType: "project", itemTitle: json.project.title, to: stageLabels[json.project.stage as CompanyProjectStage] })
    }
  }

  async function handleDelete(id: string) {
    const proj = projects.find(p => p.id === id)
    setProjects(ps => ps.filter(p => p.id !== id))
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
    if (proj) logHistory({ action: "deleted", itemType: "project", itemTitle: proj.title })
  }

  async function handleEdit(data: Partial<DBProject>) {
    if (!editProject) return
    setProjects(ps => ps.map(p => p.id === editProject.id ? { ...p, ...data } : p))
    await fetch(`/api/projects?id=${editProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--text-muted)", fontSize: 13 }}>
      {b.loading[lang]}
    </div>
  )

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
            {b.title[lang]}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
            {projects.length} {b.subtitle[lang]}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
        >
          <Plus size={14} /> {b.newProject[lang]}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <MetricCard emoji="🛠" value={projects.filter(p => p.stage === "building").length} label={b.inDev[lang]} color="var(--accent)" />
        <MetricCard emoji="🚀" value={projects.filter(p => p.stage === "launched").length} label={b.launched[lang]} color="#22C55E" />
        <MetricCard emoji="📦" value={projects.length} label={b.total[lang]} color="var(--text-secondary)" />
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {COLUMNS.map(stage => (
            <DroppableColumn
              key={stage}
              stage={stage}
              projects={projects.filter(p => p.stage === stage)}
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

      {showModal && <ProjectFormModal onSave={handleAdd} onClose={() => setShowModal(false)} />}
      {editProject && (
        <ProjectFormModal
          initial={editProject}
          onSave={data => { handleEdit(data); setEditProject(null) }}
          onClose={() => setEditProject(null)}
        />
      )}
      {detailProject && (
        <ProjectDetailPanel
          project={{ ...detailProject, url: detailProject.url ?? undefined, nextStep: detailProject.next_step ?? undefined }}
          onClose={() => setDetailProject(null)}
          onEdit={() => { setEditProject(detailProject); setDetailProject(null) }}
        />
      )}
    </div>
  )
}
