import { Card, CardBody } from "@/components/ui/card";
import { OrgForm } from "@/components/orgs/org-form";
import { createOrgAction } from "./actions";

export const metadata = { title: "Create an organization" };

export default function NewOrgPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create an organization</h1>
        <p className="text-sm text-muted">
          Showcase all events hosted under your institution or company on one page.
        </p>
      </div>
      <Card>
        <CardBody>
          <OrgForm defaultValues={{}} action={createOrgAction} submitLabel="Create organization" />
        </CardBody>
      </Card>
    </div>
  );
}
