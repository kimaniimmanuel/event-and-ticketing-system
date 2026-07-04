import { auth } from "@/auth";
import { Card, CardBody } from "@/components/ui/card";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">My account</h1>
      <Card>
        <CardBody className="space-y-1">
          <p className="text-sm text-muted">Signed in as</p>
          <p className="text-lg font-semibold">{user?.name}</p>
          <p className="text-sm text-muted">{user?.email}</p>
        </CardBody>
      </Card>
      <p className="text-sm text-muted">
        Profile editing, your registrations, and tickets arrive in later sprints.
      </p>
    </div>
  );
}
