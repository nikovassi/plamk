import { describe, expect, it } from 'vitest'
import { fieldErrors, leadSchema, quickLeadSchema, stepSchemas } from './schema'

const valid = {
  projectType: 'office', service: 'full', materials: ['al-bond'], area: '100-250', hasProject: 'yes',
  city: 'Пловдив', address: '', gps: null, name: 'Иван Петров', company: '', phone: '0888 123 456', email: '', message: '', consent: true as const,
}

describe('lead validation', () => {
  it('accepts a complete request with only required contact fields', () => {
    expect(leadSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    ['0888 123 456', true], ['+359 888 123 456', true], ['(02) 981 23 45', true],
    ['12345', false], ['abc', false], ['0888-12', false], ['+3598881234567890', false],
  ])('phone %s → %s', (phone, ok) => {
    expect(stepSchemas.contact.safeParse({ ...valid, phone }).success).toBe(ok)
  })

  it('gives a specific phone message, not a generic error', () => {
    const r = stepSchemas.contact.safeParse({ ...valid, phone: '12' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).phone).toMatch(/9–15 цифри/)
  })

  it('email is optional but validated when present', () => {
    expect(stepSchemas.contact.safeParse({ ...valid, email: '' }).success).toBe(true)
    expect(stepSchemas.contact.safeParse({ ...valid, email: 'ivan@firma.bg' }).success).toBe(true)
    const r = stepSchemas.contact.safeParse({ ...valid, email: 'ivan@' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).email).toMatch(/„@“ и домейн/)
  })

  it('message: empty is fine, too short is not', () => {
    expect(stepSchemas.contact.safeParse({ ...valid, message: '' }).success).toBe(true)
    const r = stepSchemas.contact.safeParse({ ...valid, message: 'кратко' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).message).toMatch(/поне 10 символа/)
  })

  it('requires consent', () => {
    const r = stepSchemas.contact.safeParse({ ...valid, consent: false })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).consent).toMatch(/потвърдите/)
  })

  it('requires at least one material and a city', () => {
    expect(stepSchemas.materials.safeParse({ materials: [] }).success).toBe(false)
    const none = stepSchemas.materials.safeParse({})
    expect(none.success).toBe(false)
    if (!none.success) expect(fieldErrors(none.error).materials).toMatch(/поне един материал/)
    for (const [k, schema] of Object.entries(stepSchemas)) {
      const r = schema.safeParse({})
      if (!r.success) for (const m of Object.values(fieldErrors(r.error))) expect(m, k).not.toMatch(/Invalid input/)
    }
    expect(stepSchemas.location.safeParse({ city: 'С' }).success).toBe(false)
    expect(stepSchemas.location.safeParse({ city: 'София', address: '' }).success).toBe(true)
  })

  it('rejects unknown option values', () => {
    expect(stepSchemas.projectType.safeParse({ projectType: 'castle' }).success).toBe(false)
  })

  it('quick request requires description of minimum length', () => {
    const base = { name: 'Мария', phone: '0899111222', city: 'Варна', material: 'hpl', message: 'Нова фасада на къща', consent: true }
    expect(quickLeadSchema.safeParse(base).success).toBe(true)
    const r = quickLeadSchema.safeParse({ ...base, message: 'къща' })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).message).toMatch(/поне 10/)
  })
})
