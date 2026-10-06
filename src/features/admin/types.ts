export const STATUSES = [
  { value: 'new', label: 'Ново', tone: 'bg-accent text-accent-ink' },
  { value: 'in_progress', label: 'В процес', tone: 'bg-[#2f6fd6] text-white' },
  { value: 'quoted', label: 'Изпратена оферта', tone: 'bg-[#8a5cd6] text-white' },
  { value: 'won', label: 'Спечелено', tone: 'bg-[#1f8a4c] text-white' },
  { value: 'lost', label: 'Отказано', tone: 'bg-surface-3 text-ink-2' },
] as const
export type LeadStatus = (typeof STATUSES)[number]['value']

export interface LeadFile {
  id: string
  path: string
  name: string
  mime: string
  size: number
}

export interface LeadRow {
  id: string
  reference: string
  created_at: string
  kind: 'full' | 'quick'
  status: LeadStatus
  name: string
  company: string | null
  phone: string
  email: string | null
  project_type: string | null
  service: string | null
  materials: string[]
  area: string | null
  city: string
  address: string | null
  gps: { lat: number; lng: number; accuracy?: number } | null
  has_project: string | null
  message: string | null
  source: string | null
  lead_files: LeadFile[]
}

export interface LeadNote {
  id: string
  lead_id: string
  author_email: string | null
  body: string
  created_at: string
}
