import { z } from 'zod'

const opts = <const T extends readonly { value: string; label: string }[]>(x: T) => x

export const projectTypeOptions = opts([
  { value: 'residential', label: 'Жилищна сграда' },
  { value: 'office', label: 'Офис' },
  { value: 'retail', label: 'Търговски обект' },
  { value: 'hotel', label: 'Хотел' },
  { value: 'industrial', label: 'Промишлен обект' },
  { value: 'public', label: 'Обществена сграда' },
  { value: 'other', label: 'Друго' },
] as const)

export const serviceOptions = opts([
  { value: 'design', label: 'Проектиране' },
  { value: 'supply', label: 'Доставка' },
  { value: 'install', label: 'Монтаж' },
  { value: 'full', label: 'Проектиране + доставка + монтаж' },
  { value: 'consult', label: 'Консултация' },
  { value: 'unsure', label: 'Не съм сигурен' },
] as const)

export const materialOptions = opts([
  { value: 'al-bond', label: 'Al Bond' },
  { value: 'hpl', label: 'HPL' },
  { value: 'keramika', label: 'Керамика' },
  { value: 'metal', label: 'Метална конструкция' },
  { value: 'paper', label: 'Хартиени продукти' },
  { value: 'film', label: 'Фолиа' },
  { value: 'combo', label: 'Комбинация' },
  { value: 'unsure', label: 'Не съм сигурен' },
] as const)

/** Facade/metal wizard shows only construction options; products go through the quick request */
export const PRODUCT_INTERESTS = ['paper', 'film'] as const
export const constructionMaterialOptions = materialOptions.filter((o) => !(PRODUCT_INTERESTS as readonly string[]).includes(o.value))

export const areaOptions = opts([
  { value: 'lt50', label: 'Под 50 m²' },
  { value: '50-100', label: '50–100 m²' },
  { value: '100-250', label: '100–250 m²' },
  { value: '250-500', label: '250–500 m²' },
  { value: '500-1000', label: '500–1000 m²' },
  { value: 'gt1000', label: 'Над 1000 m²' },
  { value: 'unknown', label: 'Не знам' },
] as const)

export const hasProjectOptions = opts([
  { value: 'yes', label: 'Да' },
  { value: 'no', label: 'Не' },
  { value: 'in-progress', label: 'В процес е' },
  { value: 'unsure', label: 'Не съм сигурен' },
] as const)

type Values<T extends readonly { value: string }[]> = T[number]['value']
const enumOf = <T extends readonly { value: string }[]>(o: T, msg: string) =>
  z.enum(o.map((x) => x.value) as [Values<T>, ...Values<T>[]], { error: msg })

export const labelOf = (list: readonly { value: string; label: string }[], v?: string) => list.find((x) => x.value === v)?.label ?? '—'

const PHONE_RE = /^\+?[\d\s\-().]{6,20}$/
export const phoneSchema = z
  .string({ error: 'Въведете телефон, за да можем да ви се обадим.' })
  .trim()
  .min(1, 'Въведете телефон, за да можем да ви се обадим.')
  .refine((v) => PHONE_RE.test(v) && v.replace(/\D/g, '').length >= 9 && v.replace(/\D/g, '').length <= 15, {
    message: 'Телефонът трябва да съдържа 9–15 цифри, напр. 0888 123 456 или +359 888 123 456.',
  })

const EMAIL_MSG = 'Email адресът изглежда непълен — проверете за „@“ и домейн, напр. ime@firma.bg.'
/** Optional (research: fewer required fields → more leads). Used for the confirmation email when given. */
export const emailSchema = z.string().trim().max(160, EMAIL_MSG).refine((v) => v === '' || z.email().safeParse(v).success, { message: EMAIL_MSG })

export const nameSchema = z.string({ error: 'Въведете име (поне 2 символа).' }).trim().min(2, 'Въведете име (поне 2 символа).').max(80, 'Името е твърде дълго (макс. 80 символа).')

export const MESSAGE_MIN = 10
export const MESSAGE_MAX = 2000

export const gpsSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracy: z.number().optional() })

/** Per-step schemas: the wizard validates only the current screen. */
export const stepSchemas = {
  projectType: z.object({ projectType: enumOf(projectTypeOptions, 'Изберете тип на обекта.') }),
  service: z.object({ service: enumOf(serviceOptions, 'Изберете услуга или „Не съм сигурен“.') }),
  materials: z.object({
    materials: z.array(enumOf(materialOptions, 'Невалиден материал.'), { error: 'Изберете поне един материал или „Не съм сигурен“.' }).min(1, 'Изберете поне един материал или „Не съм сигурен“.'),
  }),
  scope: z.object({
    area: enumOf(areaOptions, 'Изберете приблизителна площ или „Не знам“.'),
    hasProject: enumOf(hasProjectOptions, 'Отговорете дали имате готов проект.'),
  }),
  location: z.object({
    city: z.string({ error: 'Въведете град или населено място.' }).trim().min(2, 'Въведете град или населено място.').max(80, 'Името на града е твърде дълго.'),
    address: z.string().trim().max(160, 'Адресът е твърде дълъг (макс. 160 символа).').optional().or(z.literal('')),
    gps: gpsSchema.nullable().optional(),
  }),
  contact: z.object({
    name: nameSchema,
    company: z.string().trim().max(120, 'Името на фирмата е твърде дълго.').optional().or(z.literal('')),
    phone: phoneSchema,
    email: emailSchema.optional(),
    message: z
      .string({ error: 'Опишете проекта с текст или оставете полето празно.' })
      .trim()
      .max(MESSAGE_MAX, `Описанието е твърде дълго (макс. ${MESSAGE_MAX} символа).`)
      .refine((v) => v.length === 0 || v.length >= MESSAGE_MIN, { message: `Опишете проекта с поне ${MESSAGE_MIN} символа или оставете полето празно.` }),
    consent: z.literal(true, { error: 'Необходимо е да потвърдите, че сте запознати с обработката на данните.' }),
  }),
} as const

export const leadSchema = stepSchemas.projectType
  .extend(stepSchemas.service.shape)
  .extend(stepSchemas.materials.shape)
  .extend(stepSchemas.scope.shape)
  .extend(stepSchemas.location.shape)
  .extend(stepSchemas.contact.shape)

export type LeadInput = z.infer<typeof leadSchema>

export const quickLeadSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  city: z.string({ error: 'Въведете град или населено място.' }).trim().min(2, 'Въведете град или населено място.').max(80),
  material: enumOf(materialOptions, 'Изберете материал или „Не съм сигурен“.'),
  message: z
    .string({ error: `Опишете накратко проекта — поне ${MESSAGE_MIN} символа.` })
    .trim()
    .min(MESSAGE_MIN, `Опишете накратко проекта — поне ${MESSAGE_MIN} символа.`)
    .max(MESSAGE_MAX, `Описанието е твърде дълго (макс. ${MESSAGE_MAX} символа).`),
  consent: z.literal(true, { error: 'Необходимо е да потвърдите, че сте запознати с обработката на данните.' }),
})

export type QuickLeadInput = z.infer<typeof quickLeadSchema>

/** Form state while editing — everything optional. */
export type LeadDraft = Partial<{
  projectType: string
  service: string
  materials: string[]
  area: string
  hasProject: string
  city: string
  address: string
  gps: { lat: number; lng: number; accuracy?: number } | null
  name: string
  company: string
  phone: string
  email: string
  message: string
  consent: boolean
}>

/** Map a Zod error to { field: firstMessage } for inline display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
