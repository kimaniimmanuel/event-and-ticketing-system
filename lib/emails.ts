import { formatEventDate } from "@/lib/format";

type EmailEvent = {
  id: string;
  title: string;
  startAt: Date;
  format: string;
  venue: string | null;
  virtualLink: string | null;
};

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3210";
}

function locationLine(event: EmailEvent) {
  if (event.format === "VIRTUAL") return event.virtualLink ?? "Online event";
  return event.venue ?? "Venue to be announced";
}

function layout(heading: string, bodyHtml: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
    <div style="background:#6366f1;color:#fff;padding:16px 24px;border-radius:12px 12px 0 0;font-weight:700;font-size:18px">🎟️ DUNDA</div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
      ${bodyHtml}
    </div>
  </div>`;
}

function detailsBlock(event: EmailEvent) {
  return `<table style="margin:16px 0;font-size:14px;color:#334155">
    <tr><td style="padding:2px 12px 2px 0">📅 When</td><td>${formatEventDate(event.startAt)}</td></tr>
    <tr><td style="padding:2px 12px 2px 0">📍 Where</td><td>${locationLine(event)}</td></tr>
  </table>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">${label}</a>`;
}

export function registrationConfirmationEmail(name: string, event: EmailEvent) {
  const subject = `You're registered for ${event.title}`;
  const html = layout(
    `You're going, ${name}! 🎉`,
    `<p>Your spot for <strong>${event.title}</strong> is confirmed.</p>
     ${detailsBlock(event)}
     <p>Your digital ticket with a QR code is ready in your account.</p>
     <p>${button(`${appBaseUrl()}/account/tickets`, "View my ticket")}</p>`,
  );
  const text = `You're registered for ${event.title}.\nWhen: ${formatEventDate(event.startAt)}\nWhere: ${locationLine(event)}\nView your ticket: ${appBaseUrl()}/account/tickets`;
  return { subject, html, text };
}

export function cancellationEmail(name: string, event: EmailEvent) {
  const subject = `Your registration for ${event.title} was cancelled`;
  const html = layout(
    "Registration cancelled",
    `<p>Hi ${name}, your registration for <strong>${event.title}</strong> has been cancelled and your ticket is no longer valid.</p>
     <p>Changed your mind? You can register again anytime.</p>
     <p>${button(`${appBaseUrl()}/events/${event.id}`, "View event")}</p>`,
  );
  const text = `Your registration for ${event.title} was cancelled. Register again: ${appBaseUrl()}/events/${event.id}`;
  return { subject, html, text };
}

export function roleAssignmentEmail(name: string, event: EmailEvent, role: string) {
  const friendly = role.charAt(0) + role.slice(1).toLowerCase();
  const subject = `You're now a ${friendly.toLowerCase()} for ${event.title}`;
  const html = layout(
    `You've been added to a team 🤝`,
    `<p>Hi ${name}, you've been assigned the <strong>${friendly}</strong> role for
     <strong>${event.title}</strong>.</p>
     ${detailsBlock(event)}
     <p>${button(`${appBaseUrl()}/events/${event.id}`, "View event")}</p>`,
  );
  const text = `You've been assigned the ${friendly} role for ${event.title}. ${appBaseUrl()}/events/${event.id}`;
  return { subject, html, text };
}

export function newOrgEventEmail(
  name: string,
  orgName: string,
  event: EmailEvent,
) {
  const subject = `${orgName} just added a new event: ${event.title}`;
  const html = layout(
    `New event from ${orgName} 📣`,
    `<p>Hi ${name}, ${orgName} — which you follow — just announced a new event:</p>
     <p style="font-size:16px;font-weight:600">${event.title}</p>
     ${detailsBlock(event)}
     <p>${button(`${appBaseUrl()}/events/${event.id}`, "View & register")}</p>`,
  );
  const text = `${orgName} added a new event: ${event.title}.\nWhen: ${formatEventDate(event.startAt)}\nWhere: ${locationLine(event)}\n${appBaseUrl()}/events/${event.id}`;
  return { subject, html, text };
}

export function reminderEmail(name: string, event: EmailEvent) {
  const subject = `Reminder: ${event.title} is coming up`;
  const html = layout(
    "See you soon! ⏰",
    `<p>Hi ${name}, this is a reminder that <strong>${event.title}</strong> is happening soon.</p>
     ${detailsBlock(event)}
     <p>${button(`${appBaseUrl()}/account/tickets`, "View my ticket")}</p>`,
  );
  const text = `Reminder: ${event.title} is coming up.\nWhen: ${formatEventDate(event.startAt)}\nWhere: ${locationLine(event)}\nYour ticket: ${appBaseUrl()}/account/tickets`;
  return { subject, html, text };
}
