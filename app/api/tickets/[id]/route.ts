import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { qrPngBuffer, checkInUrl } from "@/lib/qr";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { registration: { select: { userId: true, eventId: true } } },
  });
  if (!ticket || ticket.registration.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const png = await qrPngBuffer(checkInUrl(ticket.registration.eventId, ticket.code));

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="tikiti-ticket-${ticket.id}.png"`,
    },
  });
}
