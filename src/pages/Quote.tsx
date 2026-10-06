import { useSearchParams } from 'react-router'
import { QuoteWizard } from '../features/quote/QuoteWizard'
import { QuickQuote } from '../features/quote/QuickQuote'
import { materialOptions, serviceOptions, type LeadDraft } from '../lib/lead/schema'
import { useSeo } from '../lib/seo'

export default function Quote() {
  const [params] = useSearchParams()
  const quick = params.get('rezhim') === 'barzo'
  useSeo({
    title: quick ? 'Бързо запитване за фасада' : 'Поискай оферта за фасада',
    description: 'Изпратете запитване за фасадна облицовка: тип обект, материал, площ, снимки или чертежи. Отнема около минута.',
    path: '/zapitvane',
  })
  const source = (params.get('ot') ?? 'direct').slice(0, 60)
  const material = params.get('material') ?? params.get('interes') ?? undefined
  const product = params.get('produkt')?.slice(0, 80) ?? undefined
  const service = params.get('usluga') ?? undefined
  const prefill: LeadDraft = {}
  if (material && materialOptions.some((o) => o.value === material)) prefill.materials = [material]
  if (service && serviceOptions.some((o) => o.value === service)) prefill.service = service
  return quick ? <QuickQuote source={source} material={prefill.materials?.[0]} product={product} /> : <QuoteWizard key="wizard" prefill={prefill} source={source} />
}
