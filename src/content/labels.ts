import type { BuildingType, MaterialKey, ServiceKey } from './types'

export const buildingTypeLabels: Record<BuildingType, string> = {
  residential: 'Жилищни',
  office: 'Офисни',
  retail: 'Търговски',
  industrial: 'Промишлени',
  hotel: 'Хотели',
  public: 'Обществени',
  other: 'Други',
}

/** Singular form, used on cards and in case studies */
export const buildingTypeSingular: Record<BuildingType, string> = {
  residential: 'Жилищна сграда',
  office: 'Офис сграда',
  retail: 'Търговски обект',
  industrial: 'Промишлен обект',
  hotel: 'Хотел',
  public: 'Обществена сграда',
  other: 'Друг обект',
}

export const materialLabels: Record<MaterialKey, string> = {
  'al-bond': 'Al Bond',
  hpl: 'HPL',
  keramika: 'Керамика',
  drugi: 'Други материали',
}

export const serviceLabels: Record<ServiceKey, string> = {
  'al-bond-montazh': 'Al Bond / ACP',
  'hpl-fasadi': 'HPL фасади',
  'keramichni-fasadi': 'Керамични фасади',
  'ventiliruemi-fasadi': 'Вентилируеми фасади',
  'okacheni-fasadi': 'Окачени фасади',
  'fasadni-konstrukcii': 'Фасадни конструкции',
  proektirane: 'Проектиране',
  dostavka: 'Доставка',
  montazh: 'Монтаж',
  'rekonstrukciya-na-fasadi': 'Реконструкция',
  'metalni-stalbishta-i-parapeti': 'Стълбища и парапети',
  'zimni-gradini': 'Зимни градини',
  'navesi-i-kozirki': 'Навеси и козирки',
  'industrialni-haleta': 'Индустриални халета',
  'metalni-vrati-i-ogradi': 'Врати и огради',
}
