import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { EventForm } from "@/components/events/event-form";
import { createEventAction } from "./actions";

export const metadata = { title: "Create an event" };

export default async function NewEventPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create an event</h1>
        <p className="text-sm text-muted">
          Fill in the details below. You&apos;ll be set as the host and can manage it anytime.
        </p>
      </div>
      <Card>
        <CardBody>
          <EventForm
            categories={categories}
            defaultValues={{}}
            action={createEventAction}
            submitLabel="Publish event"
          />
        </CardBody>
      </Card>
    </div>
  );
}
