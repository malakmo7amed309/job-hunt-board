import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const STORAGE_KEY = 'job-hunt-board-v1'

const COLUMNS = [
  {
    id: 'applied',
    label: 'Applied',
    dot: 'bg-sky-400',
    ring: 'ring-sky-400/40',
    headerText: 'text-sky-300',
  },
  {
    id: 'interview',
    label: 'Interview',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400/40',
    headerText: 'text-amber-300',
  },
  {
    id: 'offer',
    label: 'Offer',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-400/40',
    headerText: 'text-emerald-300',
  },
  {
    id: 'rejected',
    label: 'Rejected',
    dot: 'bg-rose-400',
    ring: 'ring-rose-400/40',
    headerText: 'text-rose-300',
  },
]

const PRIORITIES = {
  high: { label: 'High', chip: 'bg-rose-500/15 text-rose-300 border-rose-400/20' },
  medium: { label: 'Medium', chip: 'bg-amber-500/15 text-amber-300 border-amber-400/20' },
  low: { label: 'Low', chip: 'bg-slate-500/15 text-slate-300 border-slate-400/20' },
}

const DAY = 24 * 60 * 60 * 1000

const SEED_JOBS = [
  {
    id: 'seed-1',
    company: 'Instabug',
    role: 'Frontend Engineer (React)',
    location: 'Cairo · Hybrid',
    salary: '',
    url: 'https://instabug.com',
    status: 'interview',
    priority: 'high',
    notes: 'Technical interview done, waiting on the HR round. They asked about React performance and testing.',
    createdAt: Date.now() - 9 * DAY,
  },
  {
    id: 'seed-2',
    company: 'Valeo',
    role: 'UI Developer',
    location: 'Cairo · Onsite',
    salary: '',
    url: '',
    status: 'interview',
    priority: 'medium',
    notes: 'Second round is a live coding session. Revise closures, promises and CSS layout.',
    createdAt: Date.now() - 6 * DAY,
  },
  {
    id: 'seed-3',
    company: 'Robusta',
    role: 'Frontend Engineer',
    location: 'Remote',
    salary: '18,000 EGP',
    url: '',
    status: 'offer',
    priority: 'high',
    notes: 'Offer received. Deciding between this and waiting for Instabug.',
    createdAt: Date.now() - 15 * DAY,
  },
  {
    id: 'seed-4',
    company: 'Fawry',
    role: 'Junior Frontend Developer',
    location: 'Smart Village',
    salary: '',
    url: 'https://fawry.com',
    status: 'applied',
    priority: 'high',
    notes: 'Applied through their careers page. A friend referred me internally.',
    createdAt: Date.now() - 2 * DAY,
  },
  {
    id: 'seed-5',
    company: 'SWVL',
    role: 'Frontend Developer',
    location: 'Remote',
    salary: '',
    url: '',
    status: 'applied',
    priority: 'medium',
    notes: '',
    createdAt: Date.now() - 4 * DAY,
  },
  {
    id: 'seed-6',
    company: 'Bosta',
    role: 'React Developer',
    location: 'Cairo',
    salary: '',
    url: '',
    status: 'applied',
    priority: 'low',
    notes: 'Sent CV + portfolio link.',
    createdAt: Date.now() - 1 * DAY,
  },
  {
    id: 'seed-7',
    company: 'ITWorx',
    role: 'Junior Web Developer',
    location: 'Cairo',
    salary: '',
    url: '',
    status: 'rejected',
    priority: 'low',
    notes: 'They went with someone with more experience. Asked for feedback.',
    createdAt: Date.now() - 20 * DAY,
  },
]

function loadJobs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_JOBS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return SEED_JOBS
    return parsed
  } catch {
    return SEED_JOBS
  }
}

function relativeDate(ts) {
  const days = Math.floor((Date.now() - ts) / DAY)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1mo ago' : `${months}mo ago`
}

function makeId() {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/* ---------------- Icons ---------------- */

function Icon({ d, className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}
const ICONS = {
  plus: 'M12 5v14M5 12h14',
  search: 'M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  x: 'M18 6L6 18M6 6l12 12',
  briefcase: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
}

/* ---------------- Card ---------------- */

function CardBody({ job, onEdit, onDelete, dragging }) {
  const [confirming, setConfirming] = useState(false)
  const priority = PRIORITIES[job.priority] || PRIORITIES.medium
  return (
    <div
      className={`group rounded-xl border border-slate-700/60 bg-slate-800/70 backdrop-blur px-3.5 py-3 select-none ${
        dragging ? 'card-dragging rotate-2 opacity-95' : 'hover:border-slate-500/70 hover:bg-slate-800'
      } transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-100 truncate">{job.company}</div>
          <div className="text-sm text-slate-300 truncate">{job.role}</div>
        </div>
        <div className={`flex items-center gap-1 shrink-0 ${dragging ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          {onEdit && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(job) }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-700/70"
                title="Edit"
              >
                <Icon d={ICONS.edit} className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirming) onDelete(job.id)
                  else { setConfirming(true); setTimeout(() => setConfirming(false), 2500) }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`p-1.5 rounded-md ${confirming ? 'text-rose-300 bg-rose-500/20' : 'text-slate-400 hover:text-rose-300 hover:bg-slate-700/70'}`}
                title={confirming ? 'Click again to delete' : 'Delete'}
              >
                <Icon d={ICONS.trash} className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        {job.location && (
          <span className="inline-flex items-center gap-1">
            <Icon d={ICONS.pin} className="w-3 h-3" />
            {job.location}
          </span>
        )}
        {job.salary && <span className="text-slate-400">{job.salary}</span>}
      </div>

      {job.notes && (
        <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">{job.notes}</p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${priority.chip}`}>
          {priority.label}
        </span>
        <div className="flex items-center gap-2">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-indigo-300"
              title="Open posting"
            >
              <Icon d={ICONS.link} className="w-3.5 h-3.5" />
            </a>
          )}
          <span className="text-[10px] text-slate-500">{relativeDate(job.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

function SortableCard({ job, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`touch-none ${isDragging ? 'opacity-30' : ''}`}>
      <CardBody job={job} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

/* ---------------- Column ---------------- */

function Column({ column, jobs, onEdit, onDelete, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <section
      className={`flex flex-col w-[19rem] shrink-0 rounded-2xl border bg-slate-900/60 backdrop-blur transition-colors ${
        isOver ? `border-slate-500 ring-2 ${column.ring}` : 'border-slate-800'
      }`}
    >
      <header className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.dot}`} />
          <h2 className={`font-display font-semibold tracking-wide text-sm uppercase ${column.headerText}`}>
            {column.label}
          </h2>
          <span className="text-xs text-slate-500 font-medium bg-slate-800 rounded-full px-2 py-0.5">
            {jobs.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(column.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800"
          title={`Add to ${column.label}`}
        >
          <Icon d={ICONS.plus} className="w-4 h-4" />
        </button>
      </header>
      <div ref={setNodeRef} className="col-scroll flex-1 overflow-y-auto px-3 pb-3 pt-1 space-y-2.5 min-h-[7rem] max-h-[calc(100vh-17rem)]">
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <SortableCard key={job.id} job={job} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
        {jobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700/80 text-slate-600 text-xs text-center py-8 px-3">
            Drop cards here, or hit + to add one
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------------- Modal ---------------- */

function JobModal({ open, initial, defaultStatus, onClose, onSave }) {
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (open) {
      setForm(
        initial || {
          company: '',
          role: '',
          location: '',
          salary: '',
          url: '',
          status: defaultStatus || 'applied',
          priority: 'medium',
          notes: '',
        },
      )
    }
  }, [open, initial, defaultStatus])

  if (!open || !form) return null

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const valid = form.company.trim() && form.role.trim()

  const field =
    'w-full rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60'
  const label = 'block text-xs font-medium text-slate-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="modal-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-panel relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
          <h3 className="font-display font-semibold text-lg text-slate-100">
            {initial ? 'Edit application' : 'Add application'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800">
            <Icon d={ICONS.x} className="w-4 h-4" />
          </button>
        </div>
        <form
          className="px-5 py-4 space-y-3.5"
          onSubmit={(e) => {
            e.preventDefault()
            if (!valid) return
            onSave({
              ...(initial || {}),
              ...form,
              company: form.company.trim(),
              role: form.role.trim(),
              url: form.url.trim(),
              id: initial ? initial.id : makeId(),
              createdAt: initial ? initial.createdAt : Date.now(),
            })
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={label}>Company *</label>
              <input className={field} value={form.company} onChange={set('company')} placeholder="e.g. Instabug" autoFocus />
            </div>
            <div>
              <label className={label}>Role *</label>
              <input className={field} value={form.role} onChange={set('role')} placeholder="e.g. Frontend Developer" />
            </div>
            <div>
              <label className={label}>Location</label>
              <input className={field} value={form.location} onChange={set('location')} placeholder="Cairo · Hybrid" />
            </div>
            <div>
              <label className={label}>Salary</label>
              <input className={field} value={form.salary} onChange={set('salary')} placeholder="e.g. 15,000 EGP" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Posting link</label>
              <input className={field} value={form.url} onChange={set('url')} placeholder="https://…" />
            </div>
            <div>
              <label className={label}>Status</label>
              <select className={field} value={form.status} onChange={set('status')}>
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Priority</label>
              <select className={field} value={form.priority} onChange={set('priority')}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Notes</label>
              <textarea className={`${field} resize-none`} rows={3} value={form.notes} onChange={set('notes')} placeholder="Who did you talk to? What should you prepare?" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {initial ? 'Save changes' : 'Add application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---------------- App ---------------- */

export default function App() {
  const [jobs, setJobs] = useState(loadJobs)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState({ open: false, job: null, status: 'applied' })
  const [activeJob, setActiveJob] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
    } catch {
      /* storage full or unavailable */
    }
  }, [jobs])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return jobs
    return jobs.filter((j) =>
      [j.company, j.role, j.location, j.notes].filter(Boolean).join(' ').toLowerCase().includes(q),
    )
  }, [jobs, query])

  const stats = useMemo(() => {
    const total = jobs.length
    const interviews = jobs.filter((j) => j.status === 'interview').length
    const offers = jobs.filter((j) => j.status === 'offer').length
    const answered = interviews + offers
    const rate = total ? Math.round((answered / total) * 100) : 0
    return { total, interviews, offers, rate }
  }, [jobs])

  const jobsByStatus = (status) => filtered.filter((j) => j.status === status)

  function handleDragStart(event) {
    const job = jobs.find((j) => j.id === event.active.id)
    setActiveJob(job || null)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveJob(null)
    if (!over) return

    const activeId = active.id
    const overId = over.id
    if (activeId === overId) return

    setJobs((prev) => {
      const activeIndex = prev.findIndex((j) => j.id === activeId)
      if (activeIndex === -1) return prev
      const dragged = prev[activeIndex]
      const overIsColumn = COLUMNS.some((c) => c.id === overId)
      const overJob = prev.find((j) => j.id === overId)
      const targetStatus = overIsColumn ? overId : overJob?.status
      if (!targetStatus) return prev

      const next = [...prev]
      next.splice(activeIndex, 1)
      const moved = { ...dragged, status: targetStatus }

      if (overIsColumn) {
        // drop onto the column body: append after the last card in that column
        const lastIdx = next.map((j, i) => (j.status === targetStatus ? i : -1)).filter((i) => i >= 0).pop()
        if (lastIdx === undefined) next.unshift(moved)
        else next.splice(lastIdx + 1, 0, moved)
      } else {
        const overIndex = next.findIndex((j) => j.id === overId)
        if (dragged.status === targetStatus) {
          return arrayMove(prev, activeIndex, prev.findIndex((j) => j.id === overId))
        }
        next.splice(overIndex, 0, moved)
      }
      return next
    })
  }

  function openAdd(status = 'applied') {
    setModal({ open: true, job: null, status })
  }
  function openEdit(job) {
    setModal({ open: true, job, status: job.status })
  }
  function saveJob(job) {
    setJobs((prev) => {
      const idx = prev.findIndex((j) => j.id === job.id)
      if (idx === -1) return [job, ...prev]
      const next = [...prev]
      next[idx] = job
      return next
    })
    setModal({ open: false, job: null, status: 'applied' })
  }
  function deleteJob(id) {
    setJobs((prev) => prev.filter((j) => j.id !== id))
  }

  const statChip = 'rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur px-3.5 py-2'

  return (
    <div className="min-h-screen font-sans text-slate-200">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-300">
              <Icon d={ICONS.briefcase} className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
                Job Hunt Board
              </h1>
              <p className="text-sm text-slate-400">Track every application, land the offer.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Icon d={ICONS.search} className="w-4 h-4" />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company, role, notes…"
                className="w-64 max-w-full rounded-xl bg-slate-900/70 border border-slate-800 pl-9 pr-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
            </div>
            <button
              onClick={() => openAdd('applied')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold px-4 py-2 shadow-lg shadow-indigo-500/20"
            >
              <Icon d={ICONS.plus} className="w-4 h-4" />
              Add application
            </button>
            <button
              onClick={() => { if (window.confirm('Reset the board to the demo data? Your changes will be lost.')) setJobs(SEED_JOBS.map((j) => ({ ...j }))) }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-sm px-3 py-2"
              title="Reset demo data"
            >
              <Icon d={ICONS.refresh} className="w-4 h-4" />
              Reset
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className={statChip}>
            <div className="text-2xl font-display font-bold text-slate-50">{stats.total}</div>
            <div className="text-xs text-slate-400">Applications</div>
          </div>
          <div className={statChip}>
            <div className="text-2xl font-display font-bold text-amber-300">{stats.interviews}</div>
            <div className="text-xs text-slate-400">Interviews</div>
          </div>
          <div className={statChip}>
            <div className="text-2xl font-display font-bold text-emerald-300">{stats.offers}</div>
            <div className="text-xs text-slate-400">Offers</div>
          </div>
          <div className={statChip}>
            <div className="text-2xl font-display font-bold text-indigo-300">{stats.rate}%</div>
            <div className="text-xs text-slate-400">Response rate</div>
          </div>
        </div>

        {/* Board */}
        <main className="mt-5 flex-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveJob(null)}
          >
            <div className="board-scroll flex gap-4 overflow-x-auto pb-4 items-start">
              {COLUMNS.map((col) => (
                <Column
                  key={col.id}
                  column={col}
                  jobs={jobsByStatus(col.id)}
                  onEdit={openEdit}
                  onDelete={deleteJob}
                  onAdd={openAdd}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
              {activeJob ? <CardBody job={activeJob} dragging /> : null}
            </DragOverlay>
          </DndContext>
        </main>

        <footer className="pt-4 pb-2 text-center text-xs text-slate-600">
          Built by Malak Mohamed · React, Tailwind CSS, @dnd-kit · data stays in your browser
        </footer>
      </div>

      <JobModal
        open={modal.open}
        initial={modal.job}
        defaultStatus={modal.status}
        onClose={() => setModal({ ...modal, open: false })}
        onSave={saveJob}
      />
    </div>
  )
}
