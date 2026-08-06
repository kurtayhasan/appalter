import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// Root page component to register the '/' route in Next.js build output
// and prevent Vercel native 404: NOT_FOUND errors.
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
