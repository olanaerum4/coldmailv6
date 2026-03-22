# OutreachOS – Cold Email Tool

Erstatning for Instantly, bygget på Next.js 14 + Supabase + Resend.

## Stack
- **Next.js 14** App Router + TypeScript
- **Supabase** – database, RLS, realtime
- **Resend** – e-postsending + tracking + webhooks
- **Tailwind CSS** – styling
- **Vercel** – hosting
- **cron-job.org** – trigger sending

## Oppsett

### 1. Database
Kjør `supabase/schema.sql` i Supabase SQL Editor.

### 2. Miljøvariabler
Kopier `.env.example` til `.env.local` og fyll inn:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=https://ditt-domene.no
CRON_SECRET=et-tilfeldig-passord
```

### 3. Installer og kjør
```bash
npm install
npm run dev
```

### 4. Cron-jobb (cron-job.org)
- URL: `https://ditt-domene.no/api/cron/send`
- Metode: `POST`
- Header: `Authorization: Bearer <CRON_SECRET>`
- Frekvens: Hvert 15. minutt (eller daglig)

### 5. Resend webhook
I Resend dashboard → Webhooks:
- URL: `https://ditt-domene.no/api/webhooks/resend`
- Events: `email.bounced`, `email.complained`, `inbound.email`

## Arkitektur

```
app/
  dashboard/         – Statistikk og oversikt
  campaigns/         – Kampanjeliste + ny kampanje
  campaigns/[id]/    – Kampanjedetaljer + leads
  inbox/             – Innkommende svar
  api/
    campaigns/       – POST (opprett), GET (list)
    campaigns/[id]/leads/import/  – CSV-import
    tracking/open/[pixelId]/      – Åpningspiksel (1x1 PNG)
    tracking/click/               – Klikksporing redirect
    webhooks/resend/              – Svar- og bounce-deteksjon
    cron/send/                    – Sending av e-poster (cron)
    inbox/[id]/                   – Oppdater melding
```

## Variabler i e-poster
Bruk `{{name}}`, `{{company}}`, `{{email}}`, `{{phone}}` i emnelinjer og meldinger.

## Neste steg (del 2)
- [ ] Kampanje-status toggle (pause/aktiver) fra UI
- [ ] Unsubscribe-link automatisk innsatt
- [ ] Bulk-handlinger på leads
- [ ] A/B-testing av emnelinjer
- [ ] Multiple avsendere per kampanje

## Endringer i del 2

### Nye sider
- `/campaigns/[id]/edit` – rediger kampanje og sekvenser

### Nye API-ruter
| Route | Metode | Funksjon |
|---|---|---|
| `/api/campaigns/[id]` | PATCH | Oppdater kampanje (inkl. status toggle) |
| `/api/campaigns/[id]` | DELETE | Slett kampanje |
| `/api/campaigns/[id]/sequences` | PUT | Erstatt alle sekvenser |
| `/api/campaigns/[id]/leads` | GET | Hent leads med filtrering |
| `/api/campaigns/[id]/leads` | DELETE | Slett valgte leads (bulk) |
| `/api/unsubscribe` | GET | Avmeldingsside (rendrer HTML) |

### Nye komponenter
- `CampaignStatusToggle` – pause/aktiver/gjenoppta knapp
- `DeleteCampaignButton` – slett med bekreftelse
- `EditCampaignClient` – rediger kampanje og sekvenser
- `LeadTable` (forbedret) – statusfilter, søk, bulk-slett med checkbox

### E-postforbedringer
- Avmeldingslenke automatisk innsatt i footer på alle e-poster
- `List-Unsubscribe` header for email-klient kompatibilitet
- `replaceVars()` eksportert til eget lib-kall
