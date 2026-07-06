import nodemailer from "nodemailer";

type SendArgs = { to: string; subject: string; html: string; text: string };

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function createTransporter(): Promise<nodemailer.Transporter> {
  // 1. Real SMTP if configured (e.g. for production or a real demo inbox).
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  // 2. Dev: an Ethereal test inbox — emails aren't really delivered but are
  //    viewable at a preview URL logged to the server console.
  try {
    const account = await nodemailer.createTestAccount();
    console.log(`📧 Using Ethereal test inbox (user: ${account.user})`);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: account.user, pass: account.pass },
    });
  } catch {
    // 3. Offline fallback: log the full message as JSON to the console.
    console.log("📧 No SMTP and Ethereal unreachable — logging emails to console.");
    return nodemailer.createTransport({ jsonTransport: true });
  }
}

function getTransporter() {
  if (!transporterPromise) transporterPromise = createTransporter();
  return transporterPromise;
}

/** Send an email. Never throws — mail failures must not break the request. */
export async function sendEmail({ to, subject, html, text }: SendArgs) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "DUNDA <no-reply@dunda.dev>",
      to,
      subject,
      html,
      text,
    });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`📧 "${subject}" → ${to} — preview: ${preview}`);
    else console.log(`📧 "${subject}" → ${to} — sent`);
    return { ok: true, preview };
  } catch (error) {
    console.error(`📧 Failed to send "${subject}" to ${to}:`, error);
    return { ok: false };
  }
}
