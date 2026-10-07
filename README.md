# ПЛАМК — фасади, метални конструкции, хартиени продукти и фолиа

Опростена версия на сайта на РЕКОМ ГРУП (същия дизайн и функционалност) за **ПЛАМК ЕООД** (ЕИК 206743735, гр. Казанлък).
Адрес: https://nikovassi.github.io/plamk/

Разлики спрямо сайта на РЕКОМ ГРУП:
- раздел **Продукти** — хартиени продукти и фолиа (`src/content/products.ts`), с бързо запитване, в което продуктът е попълнен автоматично;
- без страници „Материали“, „За проектанти“ и „За нас“; услугите са 4 фасадни системи + 5 метални конструкции;
- собствен акцентен цвят (тъмен тюркоаз);
- продуктите са с векторни илюстрации (`components/media/ProductArt.tsx`) до получаване на реални снимки.

## Съдържание

- Фирмени данни: от Търговския регистър (`src/content/site.ts`). Телефон, имейл и работно време **още не са попълнени** —
  бутоните за обаждане и имейл се показват автоматично, когато се попълнят.
- Портфолио и снимки на услугите: снимките от архива на РЕКОМ ГРУП (`src/content/projects.ts`, `public/images/`).
- Продукти: `src/content/products.ts` — без измислени технически параметри; размери и цени се уточняват по запитване.
- Празни полета (сертификати, документи, числа) не се показват.

## Stack

| | |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Routing | React Router 7, всеки route е отделен chunk |
| Build | Vite 8 + собствен prerender (SSG) → статичен HTML за всеки route |
| Validation | Zod 4 (клиент и Edge Function) |
| PWA | vite-plugin-pwa (Workbox): app shell, офлайн страница, чернова на формата |
| Backend | Supabase (EU): Postgres + RLS, private Storage, Auth (admin), Edge Function, Resend за email |
| Tests | Vitest + Testing Library (71), Playwright E2E (Chrome / WebKit / Firefox, mobile + desktop) |

**Анимации без Framer Motion** — CSS + един споделен `IntersectionObserver` (< 1 KB). Ефектите от заданието
(fade, slide, scale, image reveal, counter) не изискват библиотека, а mobile bundle-ът е по-важен.
`prefers-reduced-motion` ги изключва.

## Команди

```bash
npm install
npm run dev          # http://localhost:5173/plamk/
npm run build        # SSR bundle → client build → prerender 35 routes → service worker
npm run preview      # сервира dist/ като GitHub Pages (clean URLs, 404.html със статус 404, gzip)
npm run lint         # ESLint + tsc
npm test             # unit + component тестове
npm run test:e2e     # Playwright (собствен build с подменен endpoint)
npm run images       # оптимизира реални снимки от content-images/ → AVIF/WebP
npm run icons        # регенерира PWA иконите и OG изображението
```

## Структура

```
src/
  content/        ← ЦЯЛОТО съдържание: site.ts, projects.ts, materials.ts, services.ts, documents.ts
  pages/          ← страници (lazy chunks)
  components/     ← layout, media (Media, Gallery, Lightbox, BeforeAfter), cards, sections, ui
  features/quote  ← wizard (7 стъпки), бързо запитване, качване на файлове, чернова, обобщение, успех
  features/admin  ← lead management (/admin) — зарежда supabase-js само тук
  lib/            ← lead (schema, files, draft, submit), seo + JSON-LD, filters, analytics, theme
scripts/          ← prerender + GitHub Pages preview, иконки, снимки, QA screenshots
supabase/         ← SQL миграция (RLS, storage) + Edge Function submit-lead
tests/e2e/        ← Playwright сценарии
```

## Редакция на съдържанието

Всичко е в типизирани файлове в `src/content/` — TypeScript подсказва задължителните полета.

**Фирмени данни** — `src/content/site.ts`: име, телефон, email, WhatsApp/Viber (показват се само ако са попълнени),
адрес, район на работа, срок за отговор, trust числа (`value: null` → placeholder, **не измисляйте числа**),
партньори (само с разрешение за логата).

**Нов проект** — добавете запис в `src/content/projects.ts`:

```ts
{
  id: 'p-marica-park',
  slug: 'marica-park',                 // → /proekti/marica-park
  title: 'Marica Park',
  location: { city: 'Пловдив' },
  year: 2025,
  type: 'retail',
  materials: ['al-bond', 'hpl'],
  services: ['proektirane', 'montazh', 'al-bond-montazh'],
  area: 1800,                          // само ако е потвърдено
  summary: 'Вентилируема фасада от Al Bond касети и HPL.',
  description: '…', challenge: '…', solution: '…',
  execution: ['Замерване', 'Изработка', 'Монтаж'],
  cover:   { src: 'images/projects/marica-park/hero', alt: 'Marica Park — фасада' },
  gallery: [{ src: 'images/projects/marica-park/detail-1', alt: '…' }],
  beforeAfter: { before: { src: '…/before', alt: 'Преди' }, after: { src: '…/after', alt: 'След' } }, // по желание
  featured: true,
}
```

**Снимки** — сложете оригиналите в `content-images/projects/marica-park/hero.jpg` и пуснете `npm run images`.
Скриптът генерира 480/800/1200/1800 px в AVIF и WebP, завърта по EXIF и **премахва метаданните (вкл. GPS)**.
`<Media>` автоматично използва `<picture>` с `srcset`, lazy loading и `fetchpriority` за hero.
Докато `src` липсва, се показва генерирана SVG илюстрация с етикет „Placeholder“.

**Hero видео** — `site.hero.video = { src: 'video/hero.mp4', poster: { src: 'images/hero', alt: '…' } }`.
Видео се пуска само на desktop, без Save-Data/2G/3G и без reduced motion; телефоните получават само poster.

**Регионални SEO страници** — добавете в `site.regions` само при реални проекти в региона (не се генерират празни страници).

**Документи за проектанти** — файловете в `public/downloads/`, записите в `src/content/documents.ts` (`href`).

## Backend — текущо състояние

- Supabase проект **plamk-recom** (Frankfurt), общ за сайтовете на РЕКОМ ГРУП и ПЛАМК; всяко запитване пази `site`.
- Функция `submit-lead` е deploy-ната (JWT проверката е изключена; заявки се приемат само от
  `https://nikovassi.github.io`, `https://www.recom.bg`, `https://recom.bg` — secret `ALLOWED_ORIGINS`).
- Администратор: office@plamk.net (`/admin` на всеки от двата сайта показва запитванията и от двата).
- Публичната конфигурация е в `.env.production` (без тайни).
- Имейл известия: още не са включени — нужни са `RESEND_API_KEY` и `LEAD_FROM_EMAIL` като secrets;
  получателите вече са зададени в `LEAD_NOTIFY_EMAILS`.
- При промяна на функцията: Supabase → Edge Functions → submit-lead → Code (или `supabase functions deploy`).

## Backend (запитвания, файлове, admin)

GitHub Pages е само статичен хостинг — **не съхраняваме заявки в repository-то и не симулираме backend**. Без
конфигуриран endpoint формата показва ясно съобщение и директни контакти.

Избрано решение: **Supabase в EU регион** (сравнение и аргументи в [docs/02-architecture.md](docs/02-architecture.md#6-deployment-и-backend-архитектура)).

1. Създайте проект в [supabase.com](https://supabase.com) → регион **Frankfurt (eu-central-1)**.
2. Изпълнете миграцията: `supabase db push` или копирайте `supabase/migrations/*.sql` в SQL Editor.
3. Edge Function:
   ```bash
   supabase functions deploy submit-lead --no-verify-jwt
   supabase secrets set ALLOWED_ORIGINS=https://nikovassi.github.io \
     RESEND_API_KEY=re_xxx LEAD_NOTIFY_EMAIL=office@firma.bg LEAD_FROM_EMAIL="FIRMA <noreply@firma.bg>"
   ```
   Функцията валидира данните (Zod), honeypot + минимално време за попълване, лимит по телефон, тип/MIME/magic bytes
   и размер на файловете, записва в private bucket, генерира номер `REQ-YYYY-NNNN`, изпраща потвърждение до клиента
   (ако е дал email) и известие до фирмата.
4. Admin потребител: Authentication → Users → *Add user*, после в SQL:
   `insert into admin_users (user_id) values ('<uuid на потребителя>');`
5. GitHub → Settings → Secrets and variables → Actions → **Variables** (публични стойности):
   `VITE_LEAD_ENDPOINT=https://<ref>.supabase.co/functions/v1/submit-lead`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
   Service role ключът, Resend ключът и SMTP данни **никога** не отиват във frontend-а или в repository-то.

Admin панел: `/admin` — статуси (Ново / В процес / Изпратена оферта / Спечелено / Отказано), филтри (дата, материал,
град, тип обект, статус), търсене, детайли, файлове (signed URLs, 10 мин.), вътрешни бележки. RLS позволява достъп само
на потребители в `admin_users`; админът може да променя само колоната `status`.

GDPR: изтриване по заявка — `select erase_lead('REQ-2026-0042');` (изтрива записа, бележките и файловете).

## Deployment (GitHub Pages)

1. Създайте repository (напр. `plamk`) и push-нете `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. `.github/workflows/deploy.yml`: checkout → Node 20 → `npm ci` → lint → unit tests → Playwright (Chromium, WebKit,
   Firefox) → build → deploy. Base path се взима от името на repository-то (`/<repo>/`); за custom domain задайте
   variable `VITE_BASE=/` и `VITE_SITE_URL=https://www.firma.bg`.

Как работят адресите под `/<repo>/`: всеки route се prerender-ва като `route.html` и `route/index.html`, затова
deep links работят без hash routing и без redirect; непознат адрес връща `404.html` със статус 404.

## Analytics

Изключено по подразбиране. С `VITE_PLAUSIBLE_DOMAIN` се включва Plausible (без бисквитки, без лични данни → без cookie
банер). Събития: `cta_click`, `phone_click`, `email_click`, `messenger_click`, `project_view`, `material_view`,
`service_view`, `quote_start`, `quote_step`, `quote_complete`, `quick_quote_complete`, `file_upload`, `download_click`.
Имена, телефони и email-и никога не се изпращат.

## Бъдещи функции (не са в MVP)

3D конфигуратор, AR, визуализатор на материали, онлайн калкулатор, клиентски портал, CRM интеграция, WhatsApp
автоматизация, AI квалификация на запитванията, анализ на CAD файлове. Модулът `lib/lead` и Edge Function-ът са
единствената точка на интеграция — CRM/webhook може да се добави там без промяна във frontend-а.
