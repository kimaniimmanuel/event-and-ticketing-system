import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export const metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-lg pt-8">
      <Card>
        <CardBody className="text-center">
          <h1 className="text-2xl font-bold">Welcome to Tikiti! 🎉</h1>
          <p className="mt-2 text-muted">
            Your account is ready. Preference-based onboarding arrives in Sprint 2 — for now,
            jump straight into discovering events.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink href="/events">Discover events</ButtonLink>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
