import { describe, expect, it } from 'vitest'
import { clearDraft, DRAFT_TTL_MS, isMeaningful, loadDraft, loadDraftFiles, saveDraft, saveDraftFiles } from './draft'
import { makeFile, SIG } from '../../test/files'

describe('form draft', () => {
  it('saves and restores fields and step', () => {
    saveDraft({ projectType: 'hotel', city: 'Бургас' }, 3)
    const d = loadDraft()
    expect(d?.step).toBe(3)
    expect(d?.data.city).toBe('Бургас')
    expect(isMeaningful(d)).toBe(true)
  })
  it('expires old drafts', () => {
    saveDraft({ city: 'Русе' }, 1)
    expect(loadDraft(Date.now() + DRAFT_TTL_MS + 1000)).toBeNull()
  })
  it('an empty draft is not offered for resuming', () => {
    saveDraft({ materials: [], city: '' }, 0)
    expect(isMeaningful(loadDraft())).toBe(false)
  })
  it('keeps attached files in IndexedDB and clears everything', async () => {
    const f = makeFile('plan.pdf', 'application/pdf', SIG.pdf)
    await saveDraftFiles([{ id: 'a', kind: 'pdf', file: f }])
    const back = await loadDraftFiles()
    expect(back).toHaveLength(1)
    expect(back[0].file.name).toBe('plan.pdf')
    expect(back[0].file.size).toBe(f.size)
    saveDraft({ city: 'Шумен' }, 2)
    await clearDraft()
    expect(loadDraft()).toBeNull()
    expect(await loadDraftFiles()).toHaveLength(0)
  })
  it('survives corrupted storage', () => {
    localStorage.setItem('quote-draft-v1', '{not json')
    expect(loadDraft()).toBeNull()
  })
})
