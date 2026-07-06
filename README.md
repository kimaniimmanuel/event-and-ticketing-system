# DUNDA — Centralized Event & Ticketing System

A web platform for discovering, registering for, and hosting **free** events, with digital
QR tickets. Attendees browse and filter events and RSVP; hosts create and manage events and
check attendees in. Built as a final-year academic project.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Prisma 6** + **SQLite** (portable to PostgreSQL/MySQL)
- **Auth.js (NextAuth v5)** — email/password credentials
- **Tailwind CSS 4** with a small hand-rolled UI kit
- **React Hook Form + Zod** for forms and validation
- **Nodemailer** for transactional email, **`qrcode`** for tickets

## Getting started

```bash
npm install
npx prisma migrate dev   # create the SQLite database
npm run db:seed          # add demo categories, users, and events
npm run dev              # http://localhost:3210
```

Open **http://localhost:3210**.

> **Port note:** the app runs on **3210**, not 3000. On some Windows machines port 3000 falls
> in a reserved range and fails to bind (`EACCES`), so the dev/start scripts pin 3210.

### Demo accounts

| Role     | Email                  | Password      |
| -------- | ---------------------- | ------------- |
| Host     | `host@dunda.dev`      | `password123` |
| Attendee | `attendee@dunda.dev`  | `password123` |

### Useful scripts

- `npm run dev` — start the dev server (port 3210)
- `npm run db:seed` — reseed demo data
- `npm run db:studio` — open Prisma Studio to inspect the database
- `npm run db:reset` — drop and recreate the database

## 📧 Email in development (important)

Emails (registration confirmation, cancellation, and reminders) are **not delivered to real
inboxes during development.** The app uses [**Ethereal**](https://ethereal.email), a free fake
SMTP service that *captures* each email and gives you a preview link instead of sending it.

**So registering with a real email address will not put anything in your real inbox** — this is
expected. To view a sent email:

1. Register for an event (or trigger a reminder — see below).
2. Look at the **terminal running `npm run dev`**. You'll see lines like:
   ```
   📧 Using Ethereal test inbox (user: ab12cd@ethereal.email)
   📧 "You're registered for …" → you@example.com — preview: https://ethereal.email/message/AbC123...
   ```
3. Open the `https://ethereal.email/message/...` **preview link** in your browser to see the
   rendered email.

### Sending to real inboxes (optional)

The mailer automatically switches to real delivery if SMTP credentials are present. Add these to
`.env` (e.g. a Gmail App Password, or a service like Resend/Brevo/Mailtrap) and restart:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=youraddress@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="DUNDA <youraddress@gmail.com>"
```

### Event reminders

Reminder emails for events starting within 24 hours are sent by an endpoint you trigger with a
scheduler (Windows Task Scheduler / cron):

```
GET /api/cron/reminders?secret=<CRON_SECRET>
```

`CRON_SECRET` is set in `.env`. Each registration is reminded only once.

## Project status

Built in sprints. Implemented so far: authentication, onboarding & profiles, event discovery
with search/filters, event creation & management, registration with QR tickets, and
transactional email. Upcoming: co-host/admin/volunteer roles, private-event access, QR check-in,
organizational pages, and host analytics.
