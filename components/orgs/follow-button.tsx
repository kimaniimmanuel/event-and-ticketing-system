"use client";

import { useState, useTransition } from "react";
import { Bell, BellRing } from "lucide-react";
import { toggleFollowAction } from "@/app/(public)/orgs/follow-action";
import { Button } from "@/components/ui/button";

export function FollowButton({
  organizationId,
  slug,
  initialFollowing,
  size = "md",
}: {
  organizationId: string;
  slug: string;
  initialFollowing: boolean;
  size?: "sm" | "md";
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    // Optimistic update; reconcile with the server result.
    setFollowing((f) => !f);
    startTransition(async () => {
      const result = await toggleFollowAction(organizationId, slug);
      setFollowing(result.following);
    });
  }

  return (
    <Button
      variant={following ? "outline" : "primary"}
      size={size}
      onClick={onToggle}
      disabled={isPending}
    >
      {following ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
