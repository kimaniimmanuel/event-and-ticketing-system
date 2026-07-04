import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users, CheckCircle2, XCircle, TrendingUp, Inbox } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody, Badge } from "@/components/ui/card";
import { getUserEventRole, CAN_EDIT_ROLES } from "@/lib/events";
import { formatEventDate } from "@/lib/format";

export const metadata = { title: "Event analytics" };

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export default async function EventAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, title: true, capacity: true, startAt: true },
  });
  if (!event) notFound();

  const role = await getUserEventRole(session.user.id, id);
  if (!role || !CAN_EDIT_ROLES.includes(role)) {
    redirect(`/events/${id}`);
  }

  const registrations = await prisma.registration.findMany({
    where: { eventId: id },
    include: { ticket: { select: { status: true, checkedInAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  const confirmed = registrations.filter((r) => r.status === "CONFIRMED");
  const cancelled = registrations.filter((r) => r.status === "CANCELLED");
  const checkedIn = registrations.filter((r) => r.ticket?.status === "USED");
  const fillRate =
    event.capacity && event.capacity > 0
      ? Math.round((confirmed.length / event.capacity) * 100)
      : null;
  const isPast = event.startAt.getTime() < Date.now();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to event
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted">
          {event.title}
          {isPast ? " · past event" : ""}
        </p>
      </div>

      {registrations.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-2 py-12 text-center text-muted">
            <Inbox className="h-8 w-8" />
            <p>No registration data available yet for this event.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Registered" value={confirmed.length} />
            <StatCard icon={CheckCircle2} label="Checked in" value={checkedIn.length} />
            <StatCard icon={XCircle} label="Cancellations" value={cancelled.length} />
            <StatCard
              icon={TrendingUp}
              label={event.capacity ? "Capacity filled" : "Total sign-ups"}
              value={fillRate != null ? `${fillRate}%` : registrations.length}
            />
          </div>

          <Card>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Attendee</th>
                      <th className="px-4 py-3 font-medium">Registered</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Checked in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {registrations.map((r) => {
                      const isCheckedIn = r.ticket?.status === "USED";
                      return (
                        <tr key={r.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium">{r.name}</div>
                            <div className="text-xs text-muted">{r.email}</div>
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {formatEventDate(r.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                r.status === "CONFIRMED"
                                  ? "bg-success/10 text-success"
                                  : "bg-danger/10 text-danger"
                              }
                            >
                              {r.status.toLowerCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {isCheckedIn ? (
                              <span className="inline-flex items-center gap-1 text-success">
                                <CheckCircle2 className="h-4 w-4" />
                                {r.ticket?.checkedInAt
                                  ? formatEventDate(r.ticket.checkedInAt)
                                  : "Yes"}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
