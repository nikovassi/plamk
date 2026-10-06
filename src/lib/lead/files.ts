/**
 * Client-side upload validation: extension + declared MIME + magic bytes.
 * The server (supabase/functions/submit-lead) repeats the same checks — the client
 * check exists for fast, specific feedback, not as a security boundary.
 */

export const MAX_FILES = 8
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_TOTAL_BYTES = 25 * 1024 * 1024

export type FileKind = 'pdf' | 'jpg' | 'png' | 'dwg'

interface KindSpec {
  ext: string[]
  mime: string[]
  /** Leading bytes of a valid file */
  magic: number[][]
}

export const FILE_KINDS: Record<FileKind, KindSpec> = {
  pdf: { ext: ['pdf'], mime: ['application/pdf'], magic: [[0x25, 0x50, 0x44, 0x46]] }, // %PDF
  jpg: { ext: ['jpg', 'jpeg'], mime: ['image/jpeg'], magic: [[0xff, 0xd8, 0xff]] },
  png: { ext: ['png'], mime: ['image/png'], magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  // DWG has no registered MIME type; browsers report "", application/octet-stream or vendor types.
  dwg: {
    ext: ['dwg'],
    mime: ['', 'application/octet-stream', 'application/acad', 'application/x-acad', 'application/autocad_dwg', 'image/vnd.dwg', 'image/x-dwg', 'application/dwg', 'application/x-dwg'],
    magic: [[0x41, 0x43, 0x31, 0x30]], // "AC10"
  },
}

export const ACCEPT_ATTR = '.pdf,.jpg,.jpeg,.png,.dwg,application/pdf,image/jpeg,image/png'
export const ACCEPT_IMAGES = 'image/jpeg,image/png'

export const formatBytes = (n: number) =>
  n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1).replace('.0', '')} MB`

export function extOf(name: string) {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(i + 1).toLowerCase() : ''
}

export function kindFromName(name: string): FileKind | null {
  const e = extOf(name)
  return (Object.keys(FILE_KINDS) as FileKind[]).find((k) => FILE_KINDS[k].ext.includes(e)) ?? null
}

const BLOCKED_EXT = new Set(['exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'js', 'mjs', 'vbs', 'ps1', 'sh', 'jar', 'apk', 'app', 'dmg', 'html', 'htm', 'svg', 'php'])

async function readHead(file: Blob, n = 16): Promise<Uint8Array> {
  const blob = file.slice(0, n)
  if (typeof blob.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer())
  // Fallback for environments without Blob.arrayBuffer
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer))
    r.onerror = () => reject(r.error)
    r.readAsArrayBuffer(blob)
  })
}

export const matchesMagic = (head: Uint8Array, kind: FileKind) =>
  FILE_KINDS[kind].magic.some((sig) => sig.every((b, i) => head[i] === b))

export type FileCheck = { ok: true; kind: FileKind } | { ok: false; error: string }

export async function validateFile(file: File): Promise<FileCheck> {
  const ext = extOf(file.name)
  if (BLOCKED_EXT.has(ext)) return { ok: false, error: `„${file.name}“: изпълними и скриптови файлове не се приемат.` }
  const kind = kindFromName(file.name)
  if (!kind) return { ok: false, error: `„${file.name}“: неподдържан формат. Приемаме PDF, JPG, PNG и DWG.` }
  if (file.size === 0) return { ok: false, error: `„${file.name}“: файлът е празен.` }
  if (file.size > MAX_FILE_BYTES)
    return { ok: false, error: `„${file.name}“ е ${formatBytes(file.size)} — максимумът е ${formatBytes(MAX_FILE_BYTES)} на файл. Намалете размера или го изпратете по email.` }
  const mime = file.type.toLowerCase()
  if (!FILE_KINDS[kind].mime.includes(mime))
    return { ok: false, error: `„${file.name}“: съдържанието (${mime || 'неизвестен тип'}) не съответства на разширението .${ext}.` }
  let head: Uint8Array
  try {
    head = await readHead(file)
  } catch {
    return { ok: false, error: `„${file.name}“: файлът не може да бъде прочетен.` }
  }
  if (!matchesMagic(head, kind)) return { ok: false, error: `„${file.name}“: файлът изглежда повреден или не е истински .${ext}.` }
  return { ok: true, kind }
}

export interface Attachment {
  id: string
  file: File
  kind: FileKind
}

export interface AddResult {
  added: Attachment[]
  errors: string[]
}

/** Validate a batch against per-file rules and the overall count/size limits. */
export async function addFiles(existing: Attachment[], incoming: File[]): Promise<AddResult> {
  const added: Attachment[] = []
  const errors: string[] = []
  let total = existing.reduce((s, a) => s + a.file.size, 0)
  for (const file of incoming) {
    if (existing.length + added.length >= MAX_FILES) {
      errors.push(`Може да прикачите до ${MAX_FILES} файла. „${file.name}“ не е добавен.`)
      continue
    }
    if (existing.some((a) => a.file.name === file.name && a.file.size === file.size)) continue
    const res = await validateFile(file)
    if (!res.ok) {
      errors.push(res.error)
      continue
    }
    if (total + file.size > MAX_TOTAL_BYTES) {
      errors.push(`Общият размер надхвърля ${formatBytes(MAX_TOTAL_BYTES)}. „${file.name}“ не е добавен — изпратете големите файлове по email.`)
      continue
    }
    total += file.size
    added.push({ id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, file, kind: res.kind })
  }
  return { added, errors }
}
