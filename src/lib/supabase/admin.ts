// lib/supabase/admin.ts
// SERVICE ROLE client — YALNIZCA sunucu tarafında kullanılır.
// Bu client RLS'yi BYPASS eder. Hiçbir zaman client bundle'a dahil edilmez.
// Kullanım alanları: generateStaticParams, cron jobs, ingest pipeline, admin API routes.

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// ---------------------------------------------------------------------------
// createAdminClient — service role key ile RLS bypass client.
// Her çağrıda yeni instance oluşturur (singleton gereksiz — sunucu taraflı).
// ---------------------------------------------------------------------------
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "[AppAlter Admin] NEXT_PUBLIC_SUPABASE_URL environment variable is not set."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "[AppAlter Admin] SUPABASE_SERVICE_ROLE_KEY environment variable is not set. " +
        "This key must NEVER be exposed to the client."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      // Admin client'ın auth session'a ihtiyacı yok — tamamen devre dışı.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        // Tüm admin requestleri için source header — logging/monitoring için
        "x-appalter-source": "server-admin",
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Type export — dışarıdan client tipine erişim için
// ---------------------------------------------------------------------------
export type AdminClient = ReturnType<typeof createAdminClient>;
