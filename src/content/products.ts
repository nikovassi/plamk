/**
 * Trade products. Descriptions are general on purpose: sizes, thicknesses, ply counts and prices
 * depend on the current supply and are confirmed per order — never publish invented specifications.
 */
export type ProductArtKind =
  | 'toilet-paper'
  | 'kitchen-roll'
  | 'hand-towels'
  | 'napkins'
  | 'jumbo-roll'
  | 'stretch-film'
  | 'pe-film'
  | 'shrink-film'
  | 'bubble-film'
  | 'construction-film'

export interface ProductItem {
  id: string
  name: string
  description: string
  uses: string[]
  art: ProductArtKind
}

export interface ProductCategory {
  slug: 'hartieni-produkti' | 'folia'
  /** value used by the quote form (materialOptions) */
  interest: 'paper' | 'film'
  name: string
  eyebrow: string
  shortDescription: string
  description: string
  forWhom: string[]
  art: ProductArtKind
  items: ProductItem[]
  seoTitle: string
  seoDescription: string
}

export const productCategories: ProductCategory[] = [
  {
    slug: 'hartieni-produkti',
    interest: 'paper',
    name: 'Хартиени продукти',
    eyebrow: 'Търговия на едро и дребно',
    shortDescription: 'Тоалетна хартия, кухненски ролки, кърпи за ръце и салфетки — за дома, офиса и професионалната кухня.',
    description:
      'Доставяме хигиенни хартиени продукти за домакинства, офиси, заведения, хотели и обществени сгради. Подбираме асортимента според нуждите на обекта — от битови опаковки до професионални ролки за диспенсъри.',
    forWhom: ['Офиси и административни сгради', 'Заведения и хотели', 'Магазини и търговци', 'Строителни обекти', 'Домакинства'],
    art: 'toilet-paper',
    items: [
      { id: 'toilet', name: 'Тоалетна хартия', description: 'Битови опаковки и професионални ролки.', uses: ['Домакинства', 'Офиси', 'Заведения'], art: 'toilet-paper' },
      { id: 'jumbo', name: 'Джъмбо ролки', description: 'Големи ролки тоалетна хартия за диспенсъри в обществени санитарни помещения.', uses: ['Обществени сгради', 'Търговски центрове', 'Хотели'], art: 'jumbo-roll' },
      { id: 'kitchen', name: 'Кухненска хартия', description: 'Кухненски ролки за дома и професионални ролки за заведения.', uses: ['Домакинства', 'Ресторанти', 'Производства'], art: 'kitchen-roll' },
      { id: 'towels', name: 'Сухи кърпи за ръце', description: 'Сгънати хартиени кърпи за ръце и кърпи на ролка за диспенсъри.', uses: ['Офиси', 'Санитарни помещения', 'Медицински кабинети'], art: 'hand-towels' },
      { id: 'napkins', name: 'Салфетки', description: 'Салфетки за маса за дома, заведения и кетъринг.', uses: ['Ресторанти', 'Кетъринг', 'Домакинства'], art: 'napkins' },
    ],
    seoTitle: 'Хартиени продукти — тоалетна хартия, кърпи за ръце, салфетки',
    seoDescription: 'Тоалетна хартия, джъмбо ролки, кухненска хартия, сухи кърпи за ръце и салфетки за офиси, заведения и домакинства.',
  },
  {
    slug: 'folia',
    interest: 'film',
    name: 'Фолиа',
    eyebrow: 'Опаковане, строителство, защита',
    shortDescription: 'Стреч фолио, полиетиленово фолио, термосвиваемо, въздушно-мехурчесто и строително фолио.',
    description:
      'Предлагаме полиетиленови фолиа за опаковане и палетизиране, за строителството и за защита при ремонти и транспорт. Размерите, дебелината и количествата уточняваме според конкретната поръчка.',
    forWhom: ['Складове и логистика', 'Производства', 'Строителни фирми', 'Търговци', 'Ремонти и преместване'],
    art: 'stretch-film',
    items: [
      { id: 'stretch', name: 'Стреч фолио', description: 'Ръчно и машинно стреч фолио за палетизиране и обвиване на товари.', uses: ['Палетизиране', 'Складове', 'Транспорт'], art: 'stretch-film' },
      { id: 'pe', name: 'Полиетиленово фолио', description: 'Прозрачно и цветно полиетиленово фолио на ролки — като ръкав, полуръкав или плоско.', uses: ['Опаковане', 'Покриване', 'Производства'], art: 'pe-film' },
      { id: 'construction', name: 'Строително фолио', description: 'Полиетиленово фолио за покриване, защита на подове и мебели и пароизолация.', uses: ['Строителни обекти', 'Ремонти', 'Боядисване'], art: 'construction-film' },
      { id: 'shrink', name: 'Термосвиваемо фолио', description: 'Фолио, което се свива при нагряване и плътно обхваща опаковката.', uses: ['Групово опаковане', 'Палети', 'Производства'], art: 'shrink-film' },
      { id: 'bubble', name: 'Въздушно-мехурчесто фолио', description: 'Фолио с въздушни мехурчета за защита на чупливи и чувствителни стоки.', uses: ['Пратки', 'Преместване', 'Електроника и стъкло'], art: 'bubble-film' },
    ],
    seoTitle: 'Фолиа — стреч фолио, полиетиленово, термосвиваемо и строително фолио',
    seoDescription: 'Стреч фолио, полиетиленово фолио, строително, термосвиваемо и въздушно-мехурчесто фолио за опаковане, строителство и защита.',
  },
]

export const getProductCategory = (slug: string) => productCategories.find((c) => c.slug === slug)
