import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

/** Whether the upload UI should be shown (falls back to a URL field otherwise). */
export const uploadsEnabled = process.env.NEXT_PUBLIC_UPLOADS_ENABLED === "true";
