# Application Audit — DUNDA Event & Ticketing System

*Point-in-time review of the codebase as built across the 10-sprint plan.*

---

## 1. Executive summary

DUNDA is a **feature-complete, well-structured Next.js 16 full-stack application** that fully
implements the Chapter 1 objectives and Chapter 3 use cases (UC-01 → UC-10), plus two
enhancements added beyond the spec (organization following/discovery, registration deadlines).

**Overall verdict:** Strong for its purpose (an academic MVP). The architecture is clean and
consistent, type-safety and validation are solid, and authorization is enforced correctly. It is
**demo-ready and defensible**. It is **not yet production-hardened** — the main gaps are the
development database (SQLite, and it is committed to git), the absence of automated tests, and a
few production concerns (secrets, rate limiting, email verification). None are surprising for an
MVP, and all are documented below.

| Area | Rating | Notes |
|---|---|---|
| Feature completeness | ✅ Excellent | All UCs + 2 extras |
| Architecture & code quality | ✅ Strong | Consistent server-action + Zod patterns |
| Security (app logic) | ✅ Good | Proper authZ, hashing, parameterized queries |
| Security (ops/secrets) | ⚠️ Needs work | Dev DB committed, placeholder secret |
| Testing | ❌ Gap | No automated tests |
| Production readiness | ⚠️ Partial | SQLite + scaling + hardening needed |
| Accessibility | 🟡 Partial | Good basics, not WCAG-certified (by scope) |

---

## 2. What's implemented (feature inventory)

**Attendee:** account signup/login, preference onboarding, profile editing, event discovery
(search + category/location/format filters), event details, RSVP registration with duplicate &
capacity guards, QR digital tickets, ticket PNG download, `.ics`/Google calendar export,
cancellation, "My tickets".

**Host / organizer:** event create/edit/delete, all event fields (incl. recurrence, capacity,
visibility, **registration deadline**), per-event roles (co-host/admin/volunteer), private events
(access code, invite link, email allowlist), **QR check-in** (camera + manual), **analytics**
(registrations, timestamps, check-ins, cancellations, fill rate).

**Organizations:** create, manage admins, associate events, public org page with upcoming/past
events + activity stats, **follow/subscribe**, org discovery (`/orgs` + discover-page rail),
follower email notifications on new events.

**Platform:** transactional email (confirmation/cancellation/reminder/role/new-event) via
Nodemailer + Ethereal dev inbox, secret-gated reminders endpoint, SEO (`robots.txt`,
`sitemap.xml`, Open Graph), responsive layout with mobile menu.

**Counts:** 17 pages, 4 API routes, 11 Prisma models, 11 server-action modules.

---

## 3. Architecture & tech stack

- **Next.js 16 (App Router)** — server components for reads, **Server Actions** for all
  mutations, Route Handlers for downloads/webhook-style endpoints.
- **TypeScript (strict)**, **Prisma 6 + SQLite**, **Auth.js v5** (credentials, JWT sessions),
  **React Hook Form + Zod**, **Tailwind 4** with a hand-rolled UI kit.
- **Route protection** via `proxy.ts` (path-based) + per-action/page role checks.
- **Separation of concerns:** validation schemas in `lib/validators/`, domain helpers in
  `lib/events.ts` / `lib/orgs.ts`, email in `lib/email.ts` + `lib/emails.ts`.

**Strengths:** one cohesive codebase (no separate backend), consistent patterns, shared Zod
schemas (client + server), typed DB access, deterministic date handling (EAT timezone).

---

## 4. Code quality

✅ **Good:** strict TypeScript with a clean `tsc --noEmit`; consistent naming and structure;
reusable components (`EventCard`, `OrgForm`, UI kit); server-side re-validation on every mutation;
transactional integrity for registration (capacity/duplicate handled inside `$transaction`).

⚠️ **Watch:**
- **No automated tests** (unit, integration, or e2e). The biggest quality gap.
- **No ESLint script** wired in `package.json` (Next ships a config but it isn't run in CI).
- **Unused dependencies:** `@auth/prisma-adapter` (not used — JWT sessions), and `node-cron`
  (only referenced in a comment; reminders use an HTTP endpoint). Safe to remove.
- **Plain `<img>`** instead of `next/image` (intentional for external URLs, but forgoes
  optimization/lazy-loading).

---

## 5. Security posture

✅ **Done well**
- Passwords **bcrypt-hashed** (10 rounds); never stored or returned in plaintext.
- **Authorization enforced** in server actions and pages via role checks (`getUserEventRole`,
  `getUserOrgRole`, `hasEventAccess`) — verified for edit/delete/roles/check-in/analytics.
- **Prisma** parameterizes all queries → no SQL injection.
- **Server Actions** are CSRF-protected by Next.js (encrypted action IDs).
- **Input validation** with Zod on both client and server.
- **Secrets git-ignored** (`.env*` in `.gitignore`).
- Reminders endpoint is **secret-gated** (`CRON_SECRET`).
- No file uploads (avatars/banners are URLs) → smaller attack surface.

⚠️ **Findings (address before any real deployment)**
| Severity | Finding | Fix |
|---|---|---|
| **High** | `prisma/dev.db` **is committed to git** (binary DB with dummy user rows) | `git rm --cached prisma/dev.db`, add `prisma/dev.db` / `*.db*` to `.gitignore` |
| **High** | `AUTH_SECRET` in `.env` is a dev placeholder | Generate a strong secret (`npx auth secret`) per environment |
| Medium | **No rate limiting** on login/signup/registration | Add throttling (e.g. Upstash rate-limit) for production |
| Medium | **No email verification / password reset** (out of scope) | Add before real users sign up |
| Low | No account lockout / brute-force protection | Combine with rate limiting |

---

## 6. Performance & scalability

- **SQLite** is perfect for local dev but is **single-writer** and file-based — it does not fit
  serverless/multi-instance hosting and won't meet the "10,000 concurrent users" NFR. Switch to
  **PostgreSQL** for production (Prisma makes this a one-line provider change — see DEPLOYMENT.md).
- Queries are reasonable; discovery uses indexed lookups and `take` limits. Add DB **indexes** on
  hot filter columns (`Event.startAt`, `Event.categoryId`, `Event.organizationId`) when moving to
  Postgres.
- Images are unoptimized (`<img>`); switching to `next/image` + a CDN would help real deployments.
- Ratings-level pages are dynamic (`ƒ`), which is correct for auth/data freshness.

---

## 7. Accessibility

🟡 **Partial (as scoped — WCAG AA certification was explicitly out of scope).**
- ✅ Semantic HTML, labelled form fields, visible focus ring (`:focus-visible`), `aria-label`s on
  icon buttons, keyboard-operable menus.
- ⚠️ Not formally audited; color-contrast, screen-reader flows, and skip-links not verified.

---

## 8. Testing

❌ **No automated tests.** For an academic MVP this is acceptable but is the clearest area to
strengthen. Recommended, in priority order:
1. **Playwright** happy-path e2e: discover → register → ticket → check-in.
2. **Vitest** unit tests for pure logic (`registrationCloseTime`, `hasEventAccess`, validators).
3. A CI workflow running `tsc --noEmit` + `next build` + tests on push.

---

## 9. Known limitations & tech debt (prioritized)

1. **Untrack `prisma/dev.db`** and gitignore it *(quick, high value)*.
2. **Remove unused deps** (`@auth/prisma-adapter`, `node-cron`) *(quick)*.
3. **Add tests + CI** *(medium)*.
4. **Postgres migration** before hosting *(medium — see DEPLOYMENT.md)*.
5. Production hardening: real `AUTH_SECRET`, rate limiting, email verification/reset *(medium)*.
6. `next/image` + image hosting *(low)*.
7. Doc alignment: update Chapter 1/3 to reflect the actual stack (Next.js/TS + SQLite→Postgres)
   and to add the two extra use cases (org following, registration deadlines).

---

## 10. Production-readiness checklist

- [ ] Untrack `dev.db`; gitignore `*.db`
- [ ] Switch datasource to PostgreSQL; run migrations on the prod DB
- [ ] Generate a strong `AUTH_SECRET`; set all env vars in the host
- [ ] Configure real SMTP (`SMTP_*`, `EMAIL_FROM`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to the deployed URL
- [ ] Schedule the reminders endpoint (host cron) with `CRON_SECRET`
- [ ] Add rate limiting on auth + registration
- [ ] Remove unused dependencies
- [ ] Add at least one e2e happy-path test + CI
- [ ] (Recommended) email verification + password reset

**Bottom line:** an excellent, complete MVP that demos and defends well. Do items 1–5 of §9 to
take it from "great school project" to "safely hostable."
