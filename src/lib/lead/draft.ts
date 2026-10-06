import type { Attachment, FileKind } from './files'
import type { LeadDraft } from './schema'

/**
 * Unfinished quote requests are kept ONLY on the visitor's device:
 * form fields in localStorage, attached files in IndexedDB. Expire after 14 days,
 * removed immediately after a successful submission or "Започни отначало".
 */
const KEY = 'quote-draft-v1'
const DB = 'quote-draft'
const STORE = 'files'
export const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000

export interface StoredDraft {
  data: LeadDraft
  step: number
  updatedAt: number
}

export function loadDraft(now = Date.now()): StoredDraft | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as StoredDraft
    if (!d || typeof d.updatedAt !== 'number' || now - d.updatedAt > DRAFT_TTL_MS) {
      void clearDraft()
      return null
    }
    return d
  } catch {
    return null
  }
}

/** True when the draft has anything worth resuming. */
export function isMeaningful(d: StoredDraft | null): d is StoredDraft {
  if (!d) return false
  return Object.values(d.data).some((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '' && v !== null && v !== false))
}

export function saveDraft(data: LeadDraft, step: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ data, step, updatedAt: Date.now() } satisfies StoredDraft))
  } catch {
    /* quota / private mode — the form keeps working without a draft */
  }
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
}

interface StoredFile {
  id: string
  kind: FileKind
  name: string
  type: string
  lastModified: number
  /** ArrayBuffer (not Blob) — structured-clones reliably in every browser/IDB implementation */
  data: ArrayBuffer
}

function readBuffer(b: Blob): Promise<ArrayBuffer> {
  if (typeof b.arrayBuffer === 'function') return b.arrayBuffer()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as ArrayBuffer)
    r.onerror = () => reject(r.error)
    r.readAsArrayBuffer(b)
  })
}

export async function saveDraftFiles(files: Attachment[]) {
  const db = await openDb()
  if (!db) return
  const payload: StoredFile[] = await Promise.all(
    files.map(async (a) => ({ id: a.id, kind: a.kind, name: a.file.name, type: a.file.type, lastModified: a.file.lastModified, data: await readBuffer(a.file) })),
  )
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(payload, 'list')
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
    tx.onabort = () => resolve()
  })
  db.close()
}

export async function loadDraftFiles(): Promise<Attachment[]> {
  const db = await openDb()
  if (!db) return []
  const list = await new Promise<StoredFile[] | undefined>((resolve) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get('list')
    req.onsuccess = () => resolve(req.result as StoredFile[] | undefined)
    req.onerror = () => resolve(undefined)
  })
  db.close()
  return (list ?? []).map((f) => ({ id: f.id, kind: f.kind, file: new File([f.data], f.name, { type: f.type, lastModified: f.lastModified }) }))
}

export async function clearDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  const db = await openDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
  db.close()
}
