import type { BuildingType, MaterialKey, Project, ServiceKey } from '../content/types'

export interface ProjectFilter {
  material?: MaterialKey
  type?: BuildingType
  service?: ServiceKey
  city?: string
}

export function filterProjects(list: Project[], f: ProjectFilter): Project[] {
  return list.filter(
    (p) =>
      (!f.material || p.materials.includes(f.material)) &&
      (!f.type || p.type === f.type) &&
      (!f.service || p.services.includes(f.service)) &&
      (!f.city || p.location.city === f.city),
  )
}

/** Only offer filter values that actually occur, so a chip never leads to an empty list. */
export function filterOptions(list: Project[]) {
  const uniq = <T,>(xs: T[]) => [...new Set(xs)]
  return {
    materials: uniq(list.flatMap((p) => p.materials)),
    types: uniq(list.map((p) => p.type)),
    services: uniq(list.flatMap((p) => p.services)),
    cities: uniq(list.map((p) => p.location.city).filter(Boolean)).sort((a, b) => a.localeCompare(b, 'bg')),
  }
}

export const projectsForMaterial = (list: Project[], m: MaterialKey) => list.filter((p) => p.materials.includes(m))
export const projectsForService = (list: Project[], s: ServiceKey) => list.filter((p) => p.services.includes(s))

/** Related = shares most materials/services, excluding itself. */
export function relatedProjects(list: Project[], p: Project, n = 3): Project[] {
  return list
    .filter((x) => x.id !== p.id)
    .map((x) => ({
      x,
      score:
        x.materials.filter((m) => p.materials.includes(m)).length * 2 +
        x.services.filter((s) => p.services.includes(s)).length +
        (x.type === p.type ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((r) => r.x)
}

const KEYS = ['material', 'type', 'service', 'city'] as const
export function parseFilter(params: URLSearchParams): ProjectFilter {
  const f: Record<string, string> = {}
  for (const k of KEYS) {
    const v = params.get(k)
    if (v) f[k] = v
  }
  return f as ProjectFilter
}
