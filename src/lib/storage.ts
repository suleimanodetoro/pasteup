import { get, set, del, keys } from 'idb-keyval'
import type { GalleryEntry, Project } from '../types'

// IndexedDB keeps large dataURL payloads out of the (small) localStorage quota.
const PROJECT_KEY = 'pasteup:project'
const GALLERY_PREFIX = 'pasteup:gallery:'

export async function saveProject(project: Project): Promise<void> {
  await set(PROJECT_KEY, project)
}

export async function loadProject(): Promise<Project | undefined> {
  try {
    return await get<Project>(PROJECT_KEY)
  } catch {
    return undefined
  }
}

export async function saveGalleryEntry(entry: GalleryEntry): Promise<void> {
  await set(GALLERY_PREFIX + entry.id, entry)
}

export async function loadGalleryEntries(): Promise<GalleryEntry[]> {
  try {
    const allKeys = await keys()
    const galleryKeys = allKeys.filter(
      (k) => typeof k === 'string' && k.startsWith(GALLERY_PREFIX),
    ) as string[]
    const entries = await Promise.all(galleryKeys.map((k) => get<GalleryEntry>(k)))
    return entries
      .filter((e): e is GalleryEntry => Boolean(e))
      .sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

export async function deleteGalleryEntry(id: string): Promise<void> {
  await del(GALLERY_PREFIX + id)
}
