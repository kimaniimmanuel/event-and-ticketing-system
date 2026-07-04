import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [categories, interests] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.userInterest.findMany({ where: { userId }, select: { categoryId: true } }),
  ]);

  return (
    <div className="mx-auto max-w-lg pt-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">What are you into? 🎉</h1>
            <p className="mt-1 text-muted">
              Pick a few interests and we&apos;ll personalize the events we show you. You can
              change these anytime.
            </p>
          </div>
          <OnboardingForm
            categories={categories}
            selectedIds={interests.map((i) => i.categoryId)}
          />
        </CardBody>
      </Card>
    </div>
  );
}
