# LASBAG - Lagos State Building Approval Gateway

_One Development. One Journey. Connected Government._

Prototype with sample data. Nothing here is an actual government approval or a live agency integration.

## Status

Front end: designed, built, type-checked, unit-tested (7 tests) and reviewed in a browser at 320, 375, 768, 1024, 1280, 1440 and 1920 using mocked API responses (no horizontal scroll at any width).

**Not verified:** the project is a prototype and has not undergone production security, accessibility, or load testing. Configure production secrets and database credentials outside source control before deployment.

Implemented: React frontend, Express backend, shared enums/schemas, Prisma schema, requirements rules engine (+tests), stage-gate engine, auth (argon2, JWT cookies, refresh rotation), PostgreSQL BYTEA document storage, MDA queue/review/decisions with audit, in-app notifications.

Added in the design pass:

- Landing: Lekki bridge hero (layered parallax, light sweep, masked headline, cursor-reactive glass cards), pinned "How it works", scroll-scrubbed "Why LASBAG" (scattered doors resolve into one journey), connected-agencies visual, counters, scroll progress bar, Lenis smooth scroll (landing only, fine-pointer devices only).
- App shell: sidebar (xl), icon rail (md-xl), bottom nav + animated drawer (mobile), route transitions, toasts, accessible dialogs, animated tabs, drag-and-drop upload with progress.
- Screens: dashboard (animated journey tracker, count-up, next-action pulse), applications, application detail, new application (typing indicator, live checklist), MDA queue and review, notifications, messages, documents, public /track, /help (search + FAQ), admin overview (charts).
- API: `GET /api/notifications`, `POST /api/notifications/read-all`, `POST /api/notifications/:id/read`, `GET /api/conversations`, `GET /api/conversations/:id`, `POST /api/conversations/:id/messages`, `POST /api/applications/:id/conversation`, `GET /api/documents` (library), `GET /api/public/track/:reference` (unauthenticated, rate limited, no personal data), `GET /api/admin/stats` (ADMIN and SUPER_ADMIN, aggregate counts only).

Deliberately not built: forgot/reset password (requested), SLA jobs, PDF summary, Privacy and Terms pages.

Design decisions and the palette, type, motion and glass recipe are in `frontend/docs/DESIGN.md`.

## Run

1. Start PostgreSQL. Copy `backend/.env.example` to `backend/.env`, then set your database credentials and two distinct random JWT secrets. Keep `ALLOW_DEMO_SEED=false` outside local development.
2. Copy `frontend/.env.example` to `frontend/.env` and configure the API URL if needed. Seeded local accounts use the development-only password `lasbag`.
3. Run `cd backend` then `npm install`.
4. For local development only, set `ALLOW_DEMO_SEED=true` in `backend/.env`. From `backend`, run `npx prisma format --schema prisma/schema.prisma`, `npm run db:migrate`, and `npm run db:seed`.
5. In one terminal run `cd backend` then `npm run dev`; in another run `cd frontend`, `npm install`, then `npm run dev` (web :5173, API :4000).
6. Run `npm test` separately from `backend` and `frontend`.

## Demo accounts

Demo seeding is development-only. Set `ALLOW_DEMO_SEED=true` in `backend/.env`, then run `npm run db:seed` from `backend`. Visit `/dev/accounts` to see the seeded usernames and shared password. This page and its credentials are publicly visible by design; use the accounts only with demo data. The seed script refuses to run in production, and `ALLOW_DEMO_SEED` must remain false there.

Each app has its own `.gitignore` for dependencies, build output, and local environment files. Generated seed-data folders/exports are ignored; the seed script and database migrations stay tracked so a clean checkout remains reproducible.

## Brand assets

`frontend/public/brand/`: `lagos-state-crest.png` is the supplied Lagos State crest, used unmodified as the LASBAG mark (WebP renditions alongside). `hero.jpg` is the supplied night Lekki bridge photo, with responsive `hero-640/960/1440` WebP and JPG renditions. No agency logos are used; agencies appear as text.
