# Архитектура на MVP

> Документът описва решенията, взети преди имплементацията. Конкурентният анализ е в [01-research.md](01-research.md).

## 1. UX анализ — изводи, които определят продукта

| Въпрос на посетителя | Къде получава отговор | Време |
|---|---|---|
| Какво прави фирмата? | Hero: заглавие + „Al Bond • HPL • Керамика“ + 1 изречение | < 3 s |
| С какви материали работи? | Hero chips → секция „Материали“ (хоризонтални карти) | < 10 s |
| Има ли опит? / Какви обекти? | Втората секция на началната страница е **портфолиото** (не „за нас“) | < 10 s |
| Работи ли в моя район? | Лента „Район на работа“ + поле „Град“ в запитването | < 20 s |
| Може ли по мой проект? | „Имате ли готов проект? Да / Не / В процес“ — и трите пътя водят до оферта | — |
| Как да поискам оферта? | Бутон в hero, в долната навигация и след всяка секция | 0 s |
| Какви файлове? | Стъпка „Файлове“ показва примери: снимка, чертеж, фасада, детайл, PDF | — |
| Колко бързо отговаряте? | Обещание за време за отговор — **content placeholder**, докато фирмата не го потвърди | — |

Принципи:
1. **Show the work first** — портфолиото е секция №2, снимките са основният визуален елемент.
2. **Една основна цел на екран** — винаги има един основен CTA („Поискай оферта“), вторичен („Обади се“) и третичен („Виж проектите“).
3. **App shell на телефон** — долна навигация, bottom sheets, хоризонтални галерии, full-screen viewer.
4. **Progressive disclosure** — формата е 7 кратки екрана; изборите с едно докосване автоматично водят към следващия.
5. **Нищо измислено** — реалните данни идват от `src/content/`; липсващите са видимо маркирани като placeholder.

## 2. Information architecture и sitemap

```
/                               Начало
├── /proekti                    Проекти (филтри: материал, тип сграда, услуга, локация)
│   └── /proekti/:slug          Case study
├── /uslugi                     Услуги
│   └── /uslugi/:slug           Услуга (landing page: al-bond-montazh, hpl-fasadi, …)
├── /materiali                  Материали
│   └── /materiali/:slug        Материал (al-bond, hpl, keramika, drugi)
├── /za-proektanti              За архитекти и проектанти (техническа информация, downloads)
├── /za-nas                     За нас (trust, сертификати, район на работа)
├── /kontakti                   Контакти
├── /zapitvane                  Запитване (7-стъпков wizard) · ?rezhim=barzo → бързо запитване
├── /poveritelnost              Политика за поверителност (GDPR)
├── /usloviya                   Общи условия
├── /biskvitki                  Бисквитки
├── /admin                      Lead management (noindex, lazy chunk, Supabase Auth)
└── /404                        Страница не е намерена
```

Регионални страници (`/fasadi-sofia`…) **не се генерират**, докато в `src/content/site.ts → regions` няма реални региони с уникално съдържание (изискване 34). Механизмът е описан в README.

### Навигация
- **Mobile (< 1024 px):** горна лента (лого, тема, телефон) + фиксирана долна навигация: Начало · Проекти · Услуги · За нас · **Запитване** (акцентен бутон). На `/zapitvane` долната навигация се скрива. На страници с детайли (проект / услуга / материал) над нея се появява компактен sticky CTA след скрол.
- **Desktop:** горна лента с всички раздели + бутон „Поискай оферта“ + „Обади се“.

## 3. Component architecture

```
src/
├── main.tsx / entry-server.tsx     hydrate / prerender (SSG)
├── App.tsx                         routes (lazy за admin)
├── content/                        typed content model (единствен източник на данни)
│   ├── types.ts                    Project, Material, Service, Certificate, Download …
│   ├── site.ts                     фирмени данни, контакти, район, trust факти
│   ├── projects.ts  materials.ts  services.ts  documents.ts
├── lib/
│   ├── lead/schema.ts              Zod схеми (wizard, бързо запитване)
│   ├── lead/files.ts               валидация на файлове (тип, размер, magic bytes)
│   ├── lead/draft.ts               чернова: localStorage + IndexedDB за файлове
│   ├── lead/submit.ts              XHR multipart → API endpoint, прогрес, офлайн
│   ├── filters.ts                  филтриране на проекти/материали
│   ├── seo.tsx                     head мениджър (SSR + client), JSON-LD генератори
│   ├── analytics.ts                cookieless analytics (Plausible) – no-op по подразбиране
│   └── theme.ts                    светла/тъмна тема
├── components/
│   ├── layout/  Header, BottomNav, StickyCta, Footer, Layout
│   ├── media/   Media (picture|placeholder), FacadeArt (SVG placeholder), Lightbox, BeforeAfter, HeroMedia
│   ├── cards/   ProjectCard, MaterialCard, ServiceCard, DownloadCard, CertificateCard
│   ├── ui/      Button, Chip, ChipScroller, Sheet (bottom sheet / modal), Reveal, Counter, Placeholder
│   └── sections/ CtaBand, TrustSection, ArchitectCta, ServiceArea, ContactActions
├── features/
│   ├── quote/   QuoteWizard, steps/*, Summary, Success, QuickQuote, DraftPrompt
│   └── admin/   AdminApp, LeadList, LeadDetail, filters (зарежда supabase-js само тук)
└── pages/       Home, Projects, ProjectDetail, Services, ServiceDetail, Materials, MaterialDetail,
                 Architects, About, Contact, Quote, Legal, NotFound
```

## 4. Data model

TypeScript типовете са в `src/content/types.ts` и `src/lib/lead/schema.ts`; таблиците — в `supabase/migrations/`.

- **Project**: `id, slug, title, location{city,region}, year, type, materials[], services[], description, challenge, solution, execution, gallery[], featured, technicalDetails[], technicalDocuments[], beforeAfter?, isPlaceholder`
- **Material**: `id, slug, name, shortDescription, description, applications[], advantages[], finishes[], colors[], formats[], technicalData[] (само проверени, със source), buildingTypes[], gallery[], relatedProjects (изчислява се от projects)`
- **Service**: `id, slug, name, seoTitle, shortDescription, description, features[], applications[], gallery[], relatedProjects (изчислява се)`
- **Lead** (DB): `id, reference (REQ-YYYY-NNNN), created_at, kind (full|quick), name, company, phone, email, project_type, service, materials[], area, city, address, gps, has_project, message, attachments (lead_files), status (new|in_progress|quoted|won|lost), consent_at`
- **LeadNote** (DB): `id, lead_id, author, body, created_at`

## 5. Quote workflow

```
Стъпка 1  Тип проект        (1 докосване → автоматично напред)
Стъпка 2  Услуга            (1 докосване → напред)
Стъпка 3  Материал          (множествен избор; „Не съм сигурен“ изключва останалите)
Стъпка 4  Площ + Готов проект?
Стъпка 5  Локация           (град*, адрес, GPS по желание)
Стъпка 6  Файлове           (камера / галерия / файлове; drag & drop на desktop)
Стъпка 7  Контакт + описание (име*, фирма, телефон*, email*, описание, съгласие*)
          ↓
Обобщение  [Редактирай] (връща към конкретната стъпка) [Изпрати запитване]
          ↓  XHR multipart с прогрес; при офлайн — изчаква мрежа, черновата се пази
Успех      REQ-2026-0042 · [Обади се] [Към началната страница]
```

- Черновата се записва при всяка промяна (localStorage за полетата, IndexedDB за файловете), изтича след 14 дни и се изтрива след успешно изпращане.
- „Бързо запитване“ (`?rezhim=barzo`) — един екран: име, телефон, град, материал, описание, снимка.

## 6. Deployment и backend архитектура

```
GitHub Pages (static, prerendered HTML за всеки route)
     │  HTTPS multipart (без тайни във frontend; anon key е публичен по дизайн)
     ▼
Supabase Edge Function `submit-lead`  (EU регион, Frankfurt)
     ├─ Zod валидация, honeypot, лимити, MIME + magic bytes
     ├─ Postgres: leads, lead_files, lead_notes (RLS: публично няма read/insert;
     │            само service role във функцията и автентикирани admin потребители)
     ├─ Storage: private bucket `lead-files` (signed URLs само за admin)
     └─ Resend API: потвърждение до клиента + известие до фирмата
Admin (/admin) → Supabase Auth (email+password) → RLS → само потребители в `admin_users`
```

### Защо Supabase (сравнение)

| Критерий | Formspree / Web3Forms | Netlify/Vercel Forms | Cloudflare Worker + D1 + R2 | **Supabase (избран)** |
|---|---|---|---|---|
| Сигурност | данните при трета страна, без RLS | ок | отлична, но всичко се пише ръчно | RLS, private storage, Auth |
| Цена | безплатно до ~50 заявки/мес., файлове платени | изисква смяна на хостинга | почти 0 | Free tier покрива MVP; Pro $25/мес. при нужда |
| Надеждност | висока | висока | висока | висока, managed Postgres + backups (Pro) |
| GDPR | US доставчици, DPA варира | US | EU jurisdiction възможна | **EU регион**, DPA, изтриване по заявка |
| Admin + статуси | няма | няма | трябва да се напише | Postgres + RLS + Auth → admin в същото SPA |
| Файлове | ограничени / платени | ограничени | R2 | Storage, private bucket |
| Поддръжка | минимална | — | по-висока | ниска, SQL миграции в repo |

Ако не е конфигуриран endpoint (`VITE_LEAD_ENDPOINT` е празен), формата **не симулира** изпращане: показва ясно съобщение и директни контакти.

### Static rendering
Всеки route се prerender-ва (`scripts/prerender.mjs`) до собствен `index.html` с title, description, canonical, OG и JSON-LD → добро SEO и работещи deep links на GitHub Pages без hash routing. `404.html` се генерира за непознати адреси.

## 7. Технологичен stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router 7 · Zod · vite-plugin-pwa (Workbox) · Vitest + Testing Library · Playwright.

**Отклонение:** вместо Framer Motion (~35–50 KB gzip) анимациите са CSS + `IntersectionObserver` (< 1 KB). Ефектите в спецификацията (fade, slide, scale, image reveal, counter) не изискват физика или layout анимации, а bundle size и Lighthouse на mobile са по-важни. `prefers-reduced-motion` изключва всички тях.

## 8. Разрешени конфликти между изискванията

| Конфликт | Решение |
|---|---|
| Долна навигация + sticky CTA → два фиксирани бара | Бутонът „Запитване“ в долната навигация е акцентен; допълнителен sticky CTA само на детайлни страници след скрол |
| 9 стъпки в спецификацията vs „Стъпка 3 от 7“ | 7 екрана, по 1–3 въпроса; обобщението не се брои като стъпка |
| „Hero видео“ vs mobile performance | Видео само ако е предоставено; на mobile / Save-Data — само poster |
| Реални проекти vs липса на материали | Типизирани примерни записи с `isPlaceholder: true` и видим етикет; генерирани SVG визуализации вместо stock снимки |
| Admin vs „не симулирай backend“ | Admin работи само със Supabase; без конфигурация показва инструкции |
