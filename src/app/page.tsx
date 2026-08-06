import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function RootPage() {
  // Middleware should normally intercept this, but this provides a fallback
  // for Next.js build requirement and statically handles '/' routes.
  redirect(`/${routing.defaultLocale}`);
}
