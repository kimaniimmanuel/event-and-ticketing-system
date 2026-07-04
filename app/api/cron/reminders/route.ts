import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { reminderEmail } from "@/lib/emails";

// Sends a reminder to every confirmed attendee of any published event starting
// within the next 24 hours that hasn't already been reminded.
//
// Trigger with a scheduler (Windows Task Scheduler / cron / node-cron) hitting:
//   GET/POST /api/cron/reminders?secret=$CRON_SECRET
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided =
    new URL(req.url).searchParams.get("secret") ?? req.headers.get("x-cron-secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const registrations = await prisma.registration.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      event: { status: "PUBLISHED", startAt: { gte: now, lte: windowEnd } },
    },
    include: { event: true },
  });

  let sent = 0;
  for (const reg of registrations) {
    const result = await sendEmail({ to: reg.email, ...reminderEmail(reg.name, reg.event) });
    if (result.ok) {
      await prisma.registration.update({
        where: { id: reg.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    }
  }

  return NextResponse.json({ processed: registrations.length, sent });
}

export const GET = run;
export const POST = run;
