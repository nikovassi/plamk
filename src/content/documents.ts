import type { DocumentItem } from './types'

/**
 * Downloads for architects. Files go to public/downloads/. Until real documents
 * are supplied every card shows "Очаква се" and is not clickable.
 * Publish manufacturer documents only where redistribution is permitted.
 */
export const documents: DocumentItem[] = [
  { id: 'd-acp-spec', title: 'Al Bond — техническа спецификация', kind: 'pdf', category: 'specification', material: 'al-bond', isPlaceholder: true },
  { id: 'd-acp-install', title: 'Al Bond — система за монтаж на касети', kind: 'pdf', category: 'installation', material: 'al-bond', isPlaceholder: true },
  { id: 'd-acp-cad', title: 'Al Bond — типови детайли', kind: 'dwg', category: 'cad', material: 'al-bond', isPlaceholder: true },
  { id: 'd-hpl-spec', title: 'HPL — техническа спецификация', kind: 'pdf', category: 'specification', material: 'hpl', isPlaceholder: true },
  { id: 'd-hpl-cad', title: 'HPL — детайли видим / скрит крепеж', kind: 'dwg', category: 'cad', material: 'hpl', isPlaceholder: true },
  { id: 'd-ceramic-spec', title: 'Керамика — система с клипси', kind: 'pdf', category: 'installation', material: 'keramika', isPlaceholder: true },
  { id: 'd-vent-detail', title: 'Вентилируема фасада — типов разрез', kind: 'dwg', category: 'detail', isPlaceholder: true },
  { id: 'd-certs', title: 'Сертификати и декларации за експлоатационни показатели', kind: 'zip', category: 'certificate', isPlaceholder: true },
]

export const documentCategoryLabels: Record<DocumentItem['category'], string> = {
  specification: 'Спецификации',
  installation: 'Системи за монтаж',
  cad: 'CAD файлове',
  detail: 'Детайли',
  certificate: 'Сертификати',
  brochure: 'Брошури',
}
