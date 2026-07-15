import { create } from 'zustand'
import type {
  Attribution,
  Clipping,
  GalleryEntry,
  Page,
  PageColorId,
  Project,
} from '../types'
import { uid } from '../lib/id'
import { getPreset, DEFAULT_PRESET_ID } from '../lib/presets'
import { measureImage } from '../lib/image'
import { makeHowToCardDataURL, HOW_TO_SIZE } from '../lib/firstRun'
import type { TrimResult } from '../lib/trim'
import {
  loadProject,
  saveProject,
  loadGalleryEntries,
  saveGalleryEntry,
  deleteGalleryEntry as delGalleryEntry,
} from '../lib/storage'

const HISTORY_LIMIT = 40

type View = 'studio' | 'gallery'

interface Snapshot {
  pages: Page[]
  activePageId: string
}

interface StageTransform {
  scale: number
  x: number
  y: number
}

interface Viewport {
  w: number
  h: number
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

export interface Toast {
  id: string
  message: string
  tone: 'info' | 'error'
}

interface StoreState {
  hydrated: boolean
  pages: Page[]
  activePageId: string
  selectedId: string | null
  view: View
  stage: StageTransform
  viewport: Viewport
  trimTargetId: string | null
  toasts: Toast[]
  gallery: GalleryEntry[]
  past: Snapshot[]
  future: Snapshot[]

  // lifecycle
  init: () => Promise<void>

  // clippings
  addImage: (
    src: string,
    opts?: { attribution?: Attribution; at?: { x: number; y: number } },
  ) => Promise<void>
  updateClipping: (id: string, patch: Partial<Clipping>) => void
  select: (id: string | null) => void
  deleteClipping: (id: string) => void
  duplicateClipping: (id: string) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  applyTrim: (id: string, result: TrimResult, naturalW: number, naturalH: number) => void
  resetTrim: (id: string) => void
  setTrimTarget: (id: string | null) => void

  // pages
  addPage: () => void
  switchPage: (id: string) => void
  deletePage: (id: string) => void
  setPreset: (presetId: string) => void
  setPageColor: (color: PageColorId) => void

  // view / zoom
  setView: (view: View) => void
  setStage: (patch: Partial<StageTransform>) => void
  setViewport: (w: number, h: number) => void
  zoomAt: (nextScale: number, center?: { x: number; y: number }) => void
  zoomBy: (factor: number) => void
  fitToScreen: () => void

  // history
  undo: () => void
  redo: () => void

  // toasts
  pushToast: (message: string, tone?: 'info' | 'error') => void
  dismissToast: (id: string) => void

  // gallery
  refreshGallery: () => Promise<void>
  submitToGallery: (entry: Omit<GalleryEntry, 'id' | 'createdAt'>) => Promise<void>
  removeGalleryEntry: (id: string) => Promise<void>

  // selectors
  activePage: () => Page | undefined
  selectedClipping: () => Clipping | undefined
}

function createDefaultProject(): Project {
  const src = makeHowToCardDataURL()
  const preset = getPreset(DEFAULT_PRESET_ID)
  const { width, height } = HOW_TO_SIZE
  const clip: Clipping = {
    id: uid('clip'),
    src,
    originalSrc: src,
    x: (preset.width - width) / 2,
    y: (preset.height - height) / 2 - 30,
    width,
    height,
    rotation: -3,
    isHowTo: true,
  }
  const page: Page = {
    id: uid('page'),
    name: 'Page 1',
    presetId: preset.id,
    width: preset.width,
    height: preset.height,
    color: 'cream',
    clippings: [clip],
  }
  return { pages: [page], activePageId: page.id }
}

let persistTimer: ReturnType<typeof setTimeout> | undefined

export const useStore = create<StoreState>()((set, get) => {
  function schedulePersist() {
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      const { pages, activePageId } = get()
      void saveProject({ pages, activePageId })
    }, 400)
  }

  /** Mutate the document (pages + activePageId) with undo/redo bookkeeping. */
  function commit(mutate: (draft: Snapshot) => void, extra?: Partial<StoreState>) {
    set((s) => {
      const prev: Snapshot = { pages: s.pages, activePageId: s.activePageId }
      const draft: Snapshot = structuredClone(prev)
      mutate(draft)
      return {
        pages: draft.pages,
        activePageId: draft.activePageId,
        past: [...s.past, prev].slice(-HISTORY_LIMIT),
        future: [],
        ...extra,
      }
    })
    schedulePersist()
  }

  function mutateActivePage(draft: Snapshot, fn: (page: Page) => void) {
    const page = draft.pages.find((p) => p.id === draft.activePageId)
    if (page) fn(page)
  }

  return {
    hydrated: false,
    pages: [],
    activePageId: '',
    selectedId: null,
    view: 'studio',
    stage: { scale: 1, x: 0, y: 0 },
    viewport: { w: 1, h: 1 },
    trimTargetId: null,
    toasts: [],
    gallery: [],
    past: [],
    future: [],

    async init() {
      const existing = await loadProject()
      const project = existing && existing.pages.length ? existing : createDefaultProject()
      set({
        pages: project.pages,
        activePageId: project.activePageId,
        hydrated: true,
      })
      void get().refreshGallery()
    },

    async addImage(src, opts) {
      let measured
      try {
        measured = await measureImage(src)
      } catch {
        get().pushToast('That image could not be loaded.', 'error')
        return
      }
      const page = get().activePage()
      if (!page) return
      const maxW = page.width * 0.6
      const maxH = page.height * 0.6
      const scale = Math.min(maxW / measured.width, maxH / measured.height, 1)
      const width = Math.round(measured.width * scale)
      const height = Math.round(measured.height * scale)
      const count = page.clippings.filter((c) => !c.isHowTo).length
      const jitter = (count % 6) * 18
      const at = opts?.at
      const x = at ? at.x - width / 2 : (page.width - width) / 2 + jitter
      const y = at ? at.y - height / 2 : (page.height - height) / 2 + jitter
      const clip: Clipping = {
        id: uid('clip'),
        src,
        originalSrc: src,
        x,
        y,
        width,
        height,
        rotation: 0,
        attribution: opts?.attribution,
      }
      commit(
        (draft) => mutateActivePage(draft, (p) => p.clippings.push(clip)),
        { selectedId: clip.id },
      )
    },

    updateClipping(id, patch) {
      commit((draft) =>
        mutateActivePage(draft, (p) => {
          const c = p.clippings.find((x) => x.id === id)
          if (c) Object.assign(c, patch)
        }),
      )
    },

    select(id) {
      set({ selectedId: id })
    },

    deleteClipping(id) {
      commit(
        (draft) =>
          mutateActivePage(draft, (p) => {
            p.clippings = p.clippings.filter((c) => c.id !== id)
          }),
        { selectedId: null, trimTargetId: null },
      )
    },

    duplicateClipping(id) {
      const newId = uid('clip')
      commit(
        (draft) =>
          mutateActivePage(draft, (p) => {
            const c = p.clippings.find((x) => x.id === id)
            if (!c) return
            p.clippings.push({
              ...c,
              id: newId,
              x: c.x + 24,
              y: c.y + 24,
              isHowTo: false,
            })
          }),
        { selectedId: newId },
      )
    },

    bringToFront(id) {
      commit((draft) =>
        mutateActivePage(draft, (p) => {
          const i = p.clippings.findIndex((c) => c.id === id)
          if (i >= 0) p.clippings.push(p.clippings.splice(i, 1)[0])
        }),
      )
    },

    sendToBack(id) {
      commit((draft) =>
        mutateActivePage(draft, (p) => {
          const i = p.clippings.findIndex((c) => c.id === id)
          if (i >= 0) p.clippings.unshift(p.clippings.splice(i, 1)[0])
        }),
      )
    },

    applyTrim(id, result, naturalW, naturalH) {
      commit(
        (draft) =>
          mutateActivePage(draft, (p) => {
            const c = p.clippings.find((x) => x.id === id)
            if (!c) return
            const pageScaleX = c.width / naturalW
            const pageScaleY = c.height / naturalH
            const dx = result.natCropX * pageScaleX
            const dy = result.natCropY * pageScaleY
            const theta = (c.rotation * Math.PI) / 180
            c.x = c.x + dx * Math.cos(theta) - dy * Math.sin(theta)
            c.y = c.y + dx * Math.sin(theta) + dy * Math.cos(theta)
            c.width = result.natCropW * pageScaleX
            c.height = result.natCropH * pageScaleY
            c.src = result.src
            c.isHowTo = false
          }),
        { trimTargetId: null },
      )
    },

    resetTrim(id) {
      commit((draft) =>
        mutateActivePage(draft, (p) => {
          const c = p.clippings.find((x) => x.id === id)
          if (c) c.src = c.originalSrc
        }),
      )
    },

    setTrimTarget(id) {
      set({ trimTargetId: id })
    },

    addPage() {
      const current = get().activePage()
      const presetId = current?.presetId ?? DEFAULT_PRESET_ID
      const preset = getPreset(presetId)
      const newId = uid('page')
      commit(
        (draft) => {
          draft.pages.push({
            id: newId,
            name: `Page ${draft.pages.length + 1}`,
            presetId,
            width: preset.width,
            height: preset.height,
            color: current?.color ?? 'cream',
            clippings: [],
          })
          draft.activePageId = newId
        },
        { selectedId: null },
      )
    },

    switchPage(id) {
      set({ activePageId: id, selectedId: null, trimTargetId: null })
      schedulePersist()
    },

    deletePage(id) {
      const { pages } = get()
      if (pages.length <= 1) {
        get().pushToast('Keep at least one page.', 'info')
        return
      }
      commit(
        (draft) => {
          draft.pages = draft.pages.filter((p) => p.id !== id)
          if (draft.activePageId === id) draft.activePageId = draft.pages[0].id
        },
        { selectedId: null },
      )
    },

    setPreset(presetId) {
      const preset = getPreset(presetId)
      commit((draft) =>
        mutateActivePage(draft, (p) => {
          p.presetId = preset.id
          p.width = preset.width
          p.height = preset.height
        }),
      )
    },

    setPageColor(color) {
      commit((draft) => mutateActivePage(draft, (p) => (p.color = color)))
    },

    setView(view) {
      set({ view })
      if (view === 'gallery') void get().refreshGallery()
    },

    setStage(patch) {
      set((s) => ({ stage: { ...s.stage, ...patch } }))
    },

    setViewport(w, h) {
      set({ viewport: { w, h } })
    },

    zoomAt(nextScale, center) {
      const s = get()
      const scale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM)
      const cx = center?.x ?? s.viewport.w / 2
      const cy = center?.y ?? s.viewport.h / 2
      const scenePointX = (cx - s.stage.x) / s.stage.scale
      const scenePointY = (cy - s.stage.y) / s.stage.scale
      set({
        stage: {
          scale,
          x: cx - scenePointX * scale,
          y: cy - scenePointY * scale,
        },
      })
    },

    zoomBy(factor) {
      get().zoomAt(get().stage.scale * factor)
    },

    fitToScreen() {
      const s = get()
      const page = s.activePage()
      if (!page) return
      const pad = 90
      const scale = clamp(
        Math.min((s.viewport.w - pad) / page.width, (s.viewport.h - pad) / page.height),
        MIN_ZOOM,
        MAX_ZOOM,
      )
      set({
        stage: {
          scale,
          x: (s.viewport.w - page.width * scale) / 2,
          y: (s.viewport.h - page.height * scale) / 2,
        },
      })
    },

    undo() {
      set((s) => {
        if (!s.past.length) return {}
        const prev = s.past[s.past.length - 1]
        const current: Snapshot = { pages: s.pages, activePageId: s.activePageId }
        return {
          pages: prev.pages,
          activePageId: prev.activePageId,
          past: s.past.slice(0, -1),
          future: [...s.future, current],
          selectedId: null,
          trimTargetId: null,
        }
      })
      schedulePersist()
    },

    redo() {
      set((s) => {
        if (!s.future.length) return {}
        const next = s.future[s.future.length - 1]
        const current: Snapshot = { pages: s.pages, activePageId: s.activePageId }
        return {
          pages: next.pages,
          activePageId: next.activePageId,
          past: [...s.past, current],
          future: s.future.slice(0, -1),
          selectedId: null,
          trimTargetId: null,
        }
      })
      schedulePersist()
    },

    pushToast(message, tone = 'info') {
      const id = uid('toast')
      set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }))
      setTimeout(() => get().dismissToast(id), 4200)
    },

    dismissToast(id) {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    },

    async refreshGallery() {
      const gallery = await loadGalleryEntries()
      set({ gallery })
    },

    async submitToGallery(entry) {
      const full: GalleryEntry = { ...entry, id: uid('gal'), createdAt: Date.now() }
      await saveGalleryEntry(full)
      await get().refreshGallery()
    },

    async removeGalleryEntry(id) {
      await delGalleryEntry(id)
      await get().refreshGallery()
    },

    activePage() {
      const { pages, activePageId } = get()
      return pages.find((p) => p.id === activePageId)
    },

    selectedClipping() {
      const page = get().activePage()
      const { selectedId } = get()
      return page?.clippings.find((c) => c.id === selectedId)
    },
  }
})
