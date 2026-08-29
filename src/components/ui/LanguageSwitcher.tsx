"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/routing";

interface LanguageSwitcherProps {
  currentLocale: string;
  locales: string[];
}

export function LanguageSwitcher({ currentLocale, locales }: LanguageSwitcherProps) {
  if (!locales || locales.length <= 1) return null;

  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    startTransition(() => {
      // @ts-ignore
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <select
      className="locale-select"
      defaultValue={currentLocale}
      onChange={onSelectChange}
      disabled={isPending}
      aria-label="Language selection"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
