'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if PostHog environment variables are configured
    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        capture_pageview: false, // We handle this manually below
        capture_pageleave: true,
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
