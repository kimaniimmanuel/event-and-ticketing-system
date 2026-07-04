import QRCode from "qrcode";

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3210";
}

/** The URL a scanned ticket QR points to (opens the check-in page for that code). */
export function checkInUrl(eventId: string, code: string) {
  return `${appBaseUrl()}/events/${eventId}/check-in?code=${code}`;
}

/** Data URL for inline <img> display of a ticket QR. */
export function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, { width: 320, margin: 1 });
}

/** PNG buffer for downloadable ticket QR. */
export function qrPngBuffer(text: string) {
  return QRCode.toBuffer(text, { type: "png", width: 600, margin: 2 });
}
