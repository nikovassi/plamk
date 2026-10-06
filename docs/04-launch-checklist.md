# Чеклист преди публикуване

## Съдържание (задължително)
- [ ] `src/content/site.ts`: име, юридическо име, ЕИК, телефон, email, адрес, работно време, WhatsApp/Viber (по желание)
- [ ] Срок за отговор (`responseTime`) — само реално обещание
- [ ] Район на работа (`serviceArea`)
- [ ] Trust числа — само проверими (години, обекти, m², гаранция)
- [ ] Лого (`components/layout/Logo.tsx`, `public/favicon.svg`) → `npm run icons`
- [ ] Brand цвят (ако има) → `--accent` в `src/index.css` (проверете контраст ≥ 4.5:1)
- [ ] Hero снимка (и видео по желание)
- [ ] Реални проекти със снимки → премахнете всички примерни записи (`isPlaceholder`)
- [ ] Сертификати (сканове / PDF)
- [ ] Технически данни на материалите — само от производителя, с източник
- [ ] Документи за проектанти (само с право на разпространение)
- [ ] Партньорски логота — само с писмено разрешение
- [ ] Правни текстове — преглед от юрист (поверителност, условия, срок на съхранение)

## Backend
- [ ] Supabase проект в EU регион, миграцията изпълнена
- [ ] `submit-lead` deploy-ната, secrets зададени (`ALLOWED_ORIGINS`, Resend)
- [ ] Домейн за изпращане на email потвърден в Resend (SPF/DKIM)
- [ ] Admin потребител добавен в `admin_users`
- [ ] GitHub Variables: `VITE_LEAD_ENDPOINT`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] Тестово запитване от телефон (със снимка от камерата) → получен email, видимо в /admin

## Хостинг
- [ ] Settings → Pages → Source: GitHub Actions
- [ ] Custom domain (по желание): `VITE_BASE=/`, `VITE_SITE_URL=https://www.…`, файл `public/CNAME`
- [ ] Google Search Console: sitemap.xml
- [ ] Google Business Profile (Local SEO)
- [ ] Analytics (по желание): `VITE_PLAUSIBLE_DOMAIN`
