# Setup & Deployment Guide — DUNDA

This guide covers **(A) running the app locally** and **(B) hosting it in production**.

---

# Part A — Local setup

## 1. Prerequisites
- **Node.js 20+** and npm (`node -v`)
- **Git**
- No database server needed locally — the app uses **SQLite** (a single file).

## 2. Install
```bash
git clone <your-repo-url>
cd event-and-ticketing-system
npm install
```

## 3. Environment variables
`.env` is **git-ignored**, so create it yourself in the project root:

```bash
# .env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="run: npx auth secret  (paste the generated value)"
NEXT_PUBLIC_APP_URL="http://localhost:3210"
EMAIL_FROM="DUNDA <no-reply@dunda.dev>"
CRON_SECRET="any-random-string-for-dev"

# Image uploads (UploadThing). Get the token from your uploadthing.com dashboard.
# Set NEXT_PUBLIC_UPLOADS_ENABLED="false" (or omit the token) to fall back to pasting URLs.
UPLOADTHING_TOKEN="your-uploadthing-token"
NEXT_PUBLIC_UPLOADS_ENABLED="true"

# Email: leave SMTP_* unset in dev to use the Ethereal preview inbox.
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
```
Image uploads use **[UploadThing](https://uploadthing.com)** — create a free account, copy the
app token, and paste it as `UPLOADTHING_TOKEN`. Uploads are gated to logged-in users.
Generate a real `AUTH_SECRET` with `npx auth secret`.

## 4. Database + seed
```bash
npx prisma migrate dev     # creates prisma/dev.db and applies migrations
npm run db:seed            # loads demo users, orgs, categories, events
```

## 5. Run
```bash
npm run dev                # http://localhost:3210
```
> **Port note:** the app runs on **3210** (port 3000 is blocked on some Windows machines).

**Demo logins** (password `password123`): `host@dunda.dev`, `attendee@dunda.dev`.

## 6. Handy commands
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (port 3210) |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run db:seed` | Re-seed demo data |
| `npm run db:studio` | Visual DB browser (Prisma Studio) |
| `npm run db:reset` | Drop, re-migrate, and re-seed |
| `npx tsc --noEmit` | Type-check |

> **Gotcha:** don't run `npm run build` while `npm run dev` is running — they share `.next` and
> it corrupts the dev route cache (causes 404s). Recovery: stop dev, delete `.next`, restart.

## 7. Viewing emails in dev
Emails aren't delivered to real inboxes in dev. After an action that sends mail, look at the
`npm run dev` terminal for a line like `📧 "…" → … — preview: https://ethereal.email/…` and open
that link.

---

# Part B — Hosting in production

## ⚠️ The one thing you must change: the database
The app currently uses **SQLite** (`file:./dev.db`). That's great locally but **won't work on
serverless/most cloud hosts** (their filesystem is read-only or wiped on each deploy, so data
disappears). For hosting, switch to **PostgreSQL**. Thanks to Prisma this is a small change.

### Switching SQLite → PostgreSQL
1. In `prisma/schema.prisma`, change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Point `DATABASE_URL` at a Postgres instance (see providers below), e.g.
   `postgresql://user:pass@host:5432/dbname?sslmode=require`.
3. Re-create the migration history for Postgres:
   ```bash
   # delete the old SQLite-specific migrations folder first if switching permanently:
   #   rm -rf prisma/migrations
   npx prisma migrate dev --name init
   ```
4. (Optional) seed the production DB once: `npm run db:seed`.

Free managed Postgres options: **Neon**, **Supabase**, **Vercel Postgres**, **Railway Postgres**.

---

## Pre-deployment checklist
- [ ] Untrack the dev DB: `git rm --cached prisma/dev.db` and add `prisma/dev.db` + `*.db*` to `.gitignore`
- [ ] Switch datasource to PostgreSQL and set `DATABASE_URL`
- [ ] Generate a strong `AUTH_SECRET` (`npx auth secret`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your real domain (e.g. `https://tikiti.example.com`)
- [ ] Configure real SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- [ ] Set a strong `CRON_SECRET`
- [ ] Remove unused deps: `npm remove @auth/prisma-adapter node-cron`

---

## Option A — Vercel + Neon (recommended for Next.js)
Easiest path; generous free tiers.

1. **Create a Postgres DB** at [neon.tech](https://neon.tech) and copy its connection string.
2. Do the **SQLite → Postgres switch** above and push to GitHub.
3. On [vercel.com](https://vercel.com): **New Project → import the repo.**
4. Add **Environment Variables** (Project → Settings → Environment Variables):
   `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `EMAIL_FROM`, `CRON_SECRET`, and the
   `SMTP_*` values.
5. **Build command:** `prisma generate && next build` (set it in Settings → General, or add a
   `postinstall: "prisma generate"` script). **Deploy.**
6. **Run migrations against prod** once: locally with the prod `DATABASE_URL` set, run
   `npx prisma migrate deploy`.
7. **Reminders cron:** add a `vercel.json` cron:
   ```json
   { "crons": [{ "path": "/api/cron/reminders?secret=YOUR_CRON_SECRET", "schedule": "0 * * * *" }] }
   ```
   (Vercel calls it hourly; the endpoint only mails events starting within 24h, once each.)

> Note: remove the hard-coded `--port 3210` from the `start`/`dev` scripts for Vercel (it manages
> the port). Vercel ignores `next start`, but keeping the flag out avoids confusion.

## Option B — Railway / Render (persistent Node host, all-in-one)
Good if you want DB + app in one place, or prefer a long-running server.

1. Create a project and add a **PostgreSQL** plugin/instance; copy its `DATABASE_URL`.
2. Deploy the repo as a **web service**. Set **Build:** `npm install && npx prisma generate && npm run build`; **Start:** `npx prisma migrate deploy && npm run start`.
3. Add all env vars (as in the checklist). Set `NEXT_PUBLIC_APP_URL` to the service URL.
4. **Reminders:** add a scheduled job (Railway Cron / Render Cron Job) that runs
   `curl -fsS "$NEXT_PUBLIC_APP_URL/api/cron/reminders?secret=$CRON_SECRET"` hourly.

*(Railway can technically keep SQLite on a persistent volume, but Postgres is recommended.)*

## Option C — Your own VPS (full control: Node + PM2 + Nginx)
For a DigitalOcean/Linode/EC2 droplet.

```bash
# on the server (Ubuntu)
sudo apt update && sudo apt install -y nginx postgresql
# install Node 20+ (nvm or nodesource), then:
git clone <repo> && cd event-and-ticketing-system
npm ci
# create .env with prod values (Postgres DATABASE_URL, AUTH_SECRET, etc.)
npx prisma migrate deploy
npm run build
npm i -g pm2
pm2 start "npm run start" --name tikiti     # serves on port 3210
pm2 save && pm2 startup
```
Put **Nginx** in front as a reverse proxy (and add HTTPS with Certbot/Let's Encrypt):
```nginx
server {
  server_name tikiti.example.com;
  location / {
    proxy_pass http://localhost:3210;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```
```bash
sudo certbot --nginx -d tikiti.example.com   # free HTTPS
```
**Reminders:** add a system crontab entry:
```
0 * * * * curl -fsS "https://tikiti.example.com/api/cron/reminders?secret=YOUR_CRON_SECRET" >/dev/null 2>&1
```

---

## Post-deploy verification
1. Visit `NEXT_PUBLIC_APP_URL` — landing loads.
2. Sign up, log in, register for an event, view the QR ticket.
3. Check `/<domain>/robots.txt` and `/sitemap.xml` resolve.
4. Trigger `/api/cron/reminders?secret=…` manually once; confirm it returns `{processed, sent}`.
5. Confirm a real email arrives (check spam on first send).

## Troubleshooting
| Symptom | Likely cause / fix |
|---|---|
| Data resets on each deploy | Still on SQLite on an ephemeral host → switch to Postgres |
| `AUTH` errors / can't stay logged in | `AUTH_SECRET` missing or differs between builds; `NEXT_PUBLIC_APP_URL` wrong |
| Emails not arriving | `SMTP_*` not set/incorrect; check provider logs and spam |
| Reminders never send | Cron not scheduled, or wrong `CRON_SECRET` |
| 404s after a local build during dev | Delete `.next`, restart `npm run dev` |
| `P1012` Prisma datasource error | You're on Prisma 7; this project pins Prisma 6 (`npm i prisma@^6 @prisma/client@^6`) |

---

**Recommended fastest route to a live demo:** *Option A (Vercel + Neon)* — free, Git-based
deploys, and cron built in.
