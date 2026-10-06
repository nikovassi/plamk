import { describe, expect, it } from 'vitest'
import { addFiles, MAX_FILE_BYTES, MAX_FILES, validateFile } from './files'
import { makeFile, SIG } from '../../test/files'

describe('file validation', () => {
  it.each([
    ['plan.pdf', 'application/pdf', SIG.pdf],
    ['photo.jpg', 'image/jpeg', SIG.jpg],
    ['photo.JPEG', 'image/jpeg', SIG.jpg],
    ['facade.png', 'image/png', SIG.png],
    ['detail.dwg', '', SIG.dwg],
    ['detail.dwg', 'application/octet-stream', SIG.dwg],
  ])('accepts %s', async (name, type, sig) => {
    expect((await validateFile(makeFile(name, type, sig))).ok).toBe(true)
  })

  it('rejects executables with a specific reason', async () => {
    const r = await validateFile(makeFile('setup.exe', 'application/x-msdownload', [0x4d, 0x5a]))
    expect(r).toEqual({ ok: false, error: expect.stringMatching(/изпълними/) })
  })

  it('rejects unsupported formats', async () => {
    const r = await validateFile(makeFile('doc.docx', 'application/vnd.openxmlformats', [0x50, 0x4b]))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/PDF, JPG, PNG и DWG/)
  })

  it('rejects a MIME type that does not match the extension', async () => {
    const r = await validateFile(makeFile('photo.jpg', 'text/html', SIG.jpg))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/не съответства/)
  })

  it('rejects renamed files via magic bytes', async () => {
    const r = await validateFile(makeFile('fake.pdf', 'application/pdf', [0x4d, 0x5a, 0, 0]))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/повреден/)
  })

  it('rejects oversized and empty files', async () => {
    const big = await validateFile(makeFile('big.pdf', 'application/pdf', SIG.pdf, MAX_FILE_BYTES + 1))
    expect(big.ok).toBe(false)
    if (!big.ok) expect(big.error).toMatch(/максимумът е 10 MB/)
    const empty = await validateFile(new File([], 'e.pdf', { type: 'application/pdf' }))
    expect(empty.ok).toBe(false)
  })

  it('enforces the max file count and skips duplicates', async () => {
    const files = Array.from({ length: MAX_FILES + 2 }, (_, i) => makeFile(`p${i}.png`, 'image/png', SIG.png))
    const r = await addFiles([], files)
    expect(r.added).toHaveLength(MAX_FILES)
    expect(r.errors).toHaveLength(2)
    const again = await addFiles(r.added.slice(0, 1), [r.added[0].file])
    expect(again.added).toHaveLength(0)
  })

  it('enforces the total size limit', async () => {
    const nine = 9 * 1024 * 1024
    const files = [1, 2, 3].map((i) => makeFile(`d${i}.pdf`, 'application/pdf', SIG.pdf, nine))
    const r = await addFiles([], files)
    expect(r.added).toHaveLength(2)
    expect(r.errors[0]).toMatch(/Общият размер/)
  })
})
