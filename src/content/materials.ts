import type { Material } from './types'

/**
 * Materials. Descriptions are general and non-technical.
 * `technicalData`, `formats` and `colors` stay EMPTY until the company supplies
 * verified data (manufacturer datasheets) — the UI then shows a clear placeholder.
 */
export const materials: Material[] = [
  {
    id: 'm-al-bond',
    slug: 'al-bond',
    name: 'Al Bond',
    aka: ['ACP', 'Alucobond', 'алуминиев композитен панел', 'еталбонд'],
    shortDescription: 'Алуминиеви композитни панели за прецизни, равни и лесни за поддръжка фасади.',
    description:
      'Алуминиевият композитен панел (ACP) се състои от два алуминиеви листа и сърцевина между тях. Фрезова се и се огъва в касети, което позволява остри ръбове, големи равни плоскости и сложна геометрия. Подходящ е за нови сгради, търговски обекти и реконструкции.',
    applications: ['Вентилируеми фасади', 'Окачени фасади', 'Козирки и бордове', 'Обшивки на колони', 'Реклама и брандиране на обекти', 'Реконструкция на стари фасади'],
    advantages: ['Ниско тегло', 'Прецизна геометрия и остри ръбове', 'Голям избор от покрития', 'Лесна поддръжка', 'Подходящ за сложни форми'],
    finishes: ['Мат', 'Гланц', 'Металик', 'Анодизиран ефект', 'Дървесна текстура', 'Каменна текстура'],
    colors: [],
    formats: [],
    technicalData: [],
    buildingTypes: ['office', 'retail', 'residential', 'industrial', 'hotel', 'public'],
    cover: { src: 'images/projects/al-bond-targovski/cover', alt: 'Търговски обект с фасада от Al Bond' },
    gallery: [
      { src: 'images/projects/al-bond-targovski/01', alt: 'Монтаж на Al Bond касети' },
      { src: 'images/projects/al-bond-zhilishtna/cover', alt: 'Al Bond акценти на жилищна сграда' },
      { src: 'images/projects/al-bond-koloni/02', alt: 'Колони, обшити с Al Bond' },
    ],
    seoTitle: 'Al Bond / Alucobond монтаж — алуминиеви композитни панели',
    seoDescription: 'Проектиране, доставка и монтаж на Al Bond (ACP, Alucobond) фасади: вентилируеми фасади, касети, обшивки и реконструкции.',
  },
  {
    id: 'm-hpl',
    slug: 'hpl',
    name: 'HPL',
    aka: ['HPL панели', 'HPL плоскости'],
    shortDescription: 'Компактни фасадни плоскости с топла визия — от дървесни до плътни цветове.',
    description:
      'HPL плоскостите се използват за вентилируеми фасади, където е важна топла, естествена визия. Монтират се върху подконструкция с видими или скрити крепежи.',
    applications: ['Вентилируеми фасади', 'Балкони и парапети', 'Обшивки на тавани и стрехи', 'Акцентни зони', 'Жилищни и обществени сгради'],
    advantages: ['Естествена визия', 'Голям избор от декори', 'Видим или скрит монтаж', 'Подходящ за комбинация с ACP'],
    finishes: ['Дървесни декори', 'Плътни цветове', 'Каменни декори', 'Метални декори'],
    colors: [],
    formats: [],
    technicalData: [],
    buildingTypes: ['residential', 'public', 'office', 'hotel'],
    cover: { src: 'images/projects/hpl-fasadi/cover', alt: 'HPL плоскости с дървесен декор' },
    gallery: [
      { src: 'images/projects/hpl-fasadi/01', alt: 'HPL облицовка по време на монтажа' },
      { src: 'images/projects/hpl-fasadi/02', alt: 'Ъгъл на сграда с HPL' },
      { src: 'images/projects/hpl-fasadi/03', alt: 'Фасада с HPL облицовка' },
    ],
    seoTitle: 'HPL фасади и HPL монтаж — вентилируеми фасади',
    seoDescription: 'HPL фасадни плоскости: проектиране на подконструкция, доставка и монтаж на вентилируеми HPL фасади.',
  },
  {
    id: 'm-keramika',
    slug: 'keramika',
    name: 'Керамика',
    aka: ['керамични фасадни плочи', 'керамогранит'],
    shortDescription: 'Керамични фасадни плочи за трайни, представителни и устойчиви фасади.',
    description:
      'Керамичните фасадни плочи се монтират като вентилируема фасада върху алуминиева подконструкция със скрити или видими клипси. Дават солидна, минерална визия и са подходящи за обекти с висок трафик.',
    applications: ['Вентилируеми фасади', 'Цокли и партерни нива', 'Обществени сгради', 'Офис сгради', 'Хотели'],
    advantages: ['Минерална, трайна визия', 'Подходяща за интензивно използвани зони', 'Скрит или видим монтаж', 'Голям избор от текстури'],
    finishes: ['Мат', 'Полиран', 'Структуриран', 'Каменна визия', 'Бетонна визия'],
    colors: [],
    formats: [],
    technicalData: [],
    buildingTypes: ['office', 'public', 'hotel', 'retail', 'residential'],
    cover: { src: 'images/projects/keramika-zhilishtna/03', alt: 'Детайл на керамична фасада' },
    gallery: [
      { src: 'images/projects/keramika-zhilishtna/01', alt: 'Керамична фасада с тъмни акценти' },
      { src: 'images/projects/keramika-zhilishtna/04', alt: 'Керамична облицовка около прозорците' },
      { src: 'images/projects/keramika-kompleks/cover', alt: 'Жилищни сгради с керамична облицовка' },
    ],
    seoTitle: 'Керамични фасади — вентилируеми керамични облицовки',
    seoDescription: 'Проектиране и монтаж на керамични вентилируеми фасади със скрит или видим крепеж.',
  },
  {
    id: 'm-drugi',
    slug: 'drugi',
    name: 'Други материали',
    aka: ['фиброцимент', 'метални касети', 'перфорирани панели'],
    shortDescription: 'Метални касети, перфорирани панели, фиброцимент и други облицовки според проекта.',
    description:
      'Освен основните материали изпълняваме и облицовки по спецификация на проектанта. Изпратете проекта или снимки и ще предложим подходящо решение.',
    applications: ['Промишлени сгради', 'Паркинги и технически фасади', 'Слънцезащита', 'Специфични архитектурни решения'],
    advantages: ['Решение според спецификацията', 'Комбиниране с основните системи'],
    finishes: [],
    colors: [],
    formats: [],
    technicalData: [],
    buildingTypes: ['industrial', 'retail', 'public', 'other'],
    cover: { src: 'images/projects/al-bond-targovski/06', alt: 'Търговска фасада с вертикални метални панели' },
    gallery: [],
    seoTitle: 'Фасадни облицовки — други фасадни материали',
    seoDescription: 'Фасадни облицовки по спецификация: метални касети, перфорирани панели, фиброцимент и комбинирани системи.',
  },
]

export const getMaterial = (slug: string) => materials.find((m) => m.slug === slug)
