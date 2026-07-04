"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { registrationSchema, type RegistrationInput } from "@/lib/validators/registration";

class RegistrationError extends Error {}

export type RegisterState = {
  error?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function registerForEventAction(
  eventId: string,
  input: RegistrationInput,
): Promise<RegisterState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { name, email, phone } = parsed.data;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "PUBLISHED") {
    return { error: "This event is not available for registration." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.registration.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (existing?.status === "CONFIRMED") {
        throw new RegistrationError("You are already registered for this event.");
      }
      if (event.capacity != null) {
        const count = await tx.registration.count({
          where: { eventId, status: "CONFIRMED" },
        });
        if (count >= event.capacity) {
          throw new RegistrationError("This event is fully booked.");
        }
      }

      if (existing) {
        // Re-activate a previously cancelled registration and its ticket.
        await tx.registration.update({
          where: { id: existing.id },
          data: { status: "CONFIRMED", name, email, phone: phone || null },
        });
        await tx.ticket.upsert({
          where: { registrationId: existing.id },
          update: { status: "VALID", checkedInAt: null, checkedInById: null },
          create: { registrationId: existing.id },
        });
      } else {
        const registration = await tx.registration.create({
          data: { eventId, userId, name, email, phone: phone || null },
        });
        await tx.ticket.create({ data: { registrationId: registration.id } });
      }
    });
  } catch (error) {
    if (error instanceof RegistrationError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/events/${eventId}`);
  redirect("/account/tickets");
}
