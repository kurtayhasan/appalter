// lib/supabase/server.ts
// SERVER-ONLY Supabase client — @supabase/ssr kullanır, cookie bazlı auth destekler.
// Bu dosya SADECE Server Components, Route Handlers ve Server Actions'ta kullanılır.
// Client component'larda kullanmayın — bunun için client.ts mevcuttur.

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

// ---------------------------------------------------------------------------
// createClient — her request için yeni bir server client oluşturur.
// Next.js App Router: cookies() her zaman request'e özel bir store döndürür.
// ---------------------------------------------------------------------------
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll Route Handler veya Server Action dışında çağrıldıysa
            // (örn. Server Component) hata fırlatır — güvenle yoksay.
            // Auth session refresh için middleware bu durumu halleder.
          }
        },
      },
    }
  );
}

// ---------------------------------------------------------------------------
// createReadOnlyClient — sadece okuma işlemleri için optimize edilmiş client.
// Cookie mutation gerektirmez — Server Component cache'leri ile uyumlu.
// ---------------------------------------------------------------------------
export async function createReadOnlyClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only client — cookie set işlemi yoksayılır
        },
      },
      // Global fetch options — Next.js cache ile entegre
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, {
            ...options,
            // next-intl + PPR ile uyumlu: her query kendi cache tag'ine sahip
            next: { revalidate: 0 },
          }),
      },
    }
  );
}

// ---------------------------------------------------------------------------
// createStaticClient — PPR ve Static Generation için
// Cookie okumaz. Tamamen anonimdir.
// ---------------------------------------------------------------------------
export function createStaticClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, {
            ...options,
            next: { revalidate: 0 },
          }),
      },
    }
  );
}
