"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { cancellationEmail } from "@/lib/emails";

export async function cancelRegistrationAction(registrationId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, userId: true, eventId: true, name: true, email: true, event: true },
  });
  if (!registration || registration.userId !== session.user.id) {
    throw new Error("Registration not found.");
  }

  // Cancel the registration and invalidate its ticket, freeing capacity.
  await prisma.$transaction([
    prisma.registration.update({
      where: { id: registrationId },
      data: { status: "CANCELLED" },
    }),
    prisma.ticket.updateMany({
      where: { registrationId },
      data: { status: "INVALID" },
    }),
  ]);

  await sendEmail({
    to: registration.email,
    ...cancellationEmail(registration.name, registration.event),
  });

  revalidatePath("/account/tickets");
  revalidatePath(`/events/${registration.eventId}`);
}
