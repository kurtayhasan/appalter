"use client";
// lib/supabase/client.ts
// Browser-side Supabase client — SADECE 'use client' bileşenlerinde kullanılır.
// Service role key burada ASLA kullanılmaz.
// Singleton pattern: bir tab'da tek client instance.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Singleton client — her render'da yeni instance oluşturmaz.
// ---------------------------------------------------------------------------
let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}

// ---------------------------------------------------------------------------
// Convenience hook-style export — client component'larda doğrudan kullanım:
//   const supabase = getSupabaseClient();
// ---------------------------------------------------------------------------
export const getSupabaseClient = createClient;
