import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildFormData, submitLead, SubmitError } from './submit'
import { makeFile, SIG } from '../../test/files'

const payload = { kind: 'quick' as const, name: 'Мария', phone: '0899111222', city: 'Варна', material: 'hpl' as const, message: 'Нова фасада на къща' }

class FakeXHR {
  static status = 200
  static body = '{"reference":"REQ-2026-0042"}'
  static last: FakeXHR
  upload = { onprogress: null as null | ((e: ProgressEvent) => void) }
  status = 0
  responseText = ''
  timeout = 0
  headers: Record<string, string> = {}
  method = ''
  url = ''
  sent: FormData | null = null
  onload: null | (() => void) = null
  onerror: null | (() => void) = null
  ontimeout: null | (() => void) = null
  open(m: string, u: string) { this.method = m; this.url = u }
  setRequestHeader(k: string, v: string) { this.headers[k] = v }
  send(b: FormData) {
    this.sent = b
    FakeXHR.last = this
    setTimeout(() => {
      this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 } as ProgressEvent)
      this.status = FakeXHR.status
      this.responseText = FakeXHR.body
      this.onload?.()
    })
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('lead submission', () => {
  it('fails loudly when no endpoint is configured (no simulated backend)', async () => {
    await expect(submitLead(payload, [], { endpoint: '' })).rejects.toMatchObject({ code: 'not-configured' })
  })

  it('builds multipart data with payload, honeypot and files', () => {
    const f = makeFile('house.jpg', 'image/jpeg', SIG.jpg)
    const fd = buildFormData(payload, [{ id: '1', kind: 'jpg', file: f }], { honeypot: '', startedAt: Date.now() - 5000, source: 'hero' })
    expect(JSON.parse(fd.get('payload') as string)).toMatchObject({ kind: 'quick', name: 'Мария', consent: true, source: 'hero' })
    expect(fd.get('website')).toBe('')
    expect(Number(fd.get('elapsedMs'))).toBeGreaterThanOrEqual(5000)
    expect((fd.getAll('files')[0] as File).name).toBe('house.jpg')
  })

  it('posts to the endpoint, reports progress and returns the reference', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXHR)
    FakeXHR.status = 200
    FakeXHR.body = '{"reference":"REQ-2026-0042"}'
    const progress: number[] = []
    const r = await submitLead(payload, [], { endpoint: 'https://api.test/submit-lead', onProgress: (p) => progress.push(p) })
    expect(r.reference).toBe('REQ-2026-0042')
    expect(FakeXHR.last.method).toBe('POST')
    expect(FakeXHR.last.url).toBe('https://api.test/submit-lead')
    expect(progress).toContain(0.5)
    expect(progress.at(-1)).toBe(1)
  })

  it('surfaces server validation errors per field', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXHR)
    FakeXHR.status = 422
    FakeXHR.body = '{"error":"Някои полета са невалидни.","fields":{"phone":"Проверете това поле."}}'
    const e = await submitLead(payload, [], { endpoint: 'https://api.test/x' }).catch((x) => x)
    expect(e).toBeInstanceOf(SubmitError)
    expect(e.code).toBe('rejected')
    expect(e.fields.phone).toBeTruthy()
  })

  it('keeps data and reports offline state', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    await expect(submitLead(payload, [], { endpoint: 'https://api.test/x' })).rejects.toMatchObject({ code: 'offline' })
    vi.restoreAllMocks()
  })
})
