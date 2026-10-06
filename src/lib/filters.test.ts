import { describe, expect, it } from 'vitest'
import { projects } from '../content/projects'
import { filterOptions, filterProjects, parseFilter, projectsForMaterial, relatedProjects } from './filters'

describe('project filtering', () => {
  it('returns everything without filters', () => {
    expect(filterProjects(projects, {})).toHaveLength(projects.length)
  })
  it('filters by material', () => {
    const r = filterProjects(projects, { material: 'hpl' })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((p) => p.materials.includes('hpl'))).toBe(true)
  })
  it('combines material + building type', () => {
    const r = filterProjects(projects, { material: 'al-bond', type: 'retail' })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((p) => p.materials.includes('al-bond') && p.type === 'retail')).toBe(true)
  })
  it('projects without a city are not offered as a location filter', () => {
    expect(filterOptions(projects).cities).not.toContain('')
  })
  it('filters by service', () => {
    const r = filterProjects(projects, { service: 'rekonstrukciya-na-fasadi' })
    expect(r.every((p) => p.services.includes('rekonstrukciya-na-fasadi'))).toBe(true)
  })
  it('only offers options that exist, so chips never lead to empty results', () => {
    const o = filterOptions(projects)
    for (const m of o.materials) expect(filterProjects(projects, { material: m }).length).toBeGreaterThan(0)
    for (const c of o.cities) expect(filterProjects(projects, { city: c }).length).toBeGreaterThan(0)
  })
  it('parses filters from the URL', () => {
    expect(parseFilter(new URLSearchParams('material=hpl&type=office&x=1'))).toEqual({ material: 'hpl', type: 'office' })
  })
  it('material → projects mapping', () => {
    expect(projectsForMaterial(projects, 'keramika').every((p) => p.materials.includes('keramika'))).toBe(true)
  })
  it('related projects exclude the current one', () => {
    const p = projects[0]
    const r = relatedProjects(projects, p)
    expect(r).toHaveLength(3)
    expect(r.some((x) => x.id === p.id)).toBe(false)
  })
})
