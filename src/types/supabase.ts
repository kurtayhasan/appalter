// src/types/supabase.ts
// Bu dosya normalde `supabase gen types typescript` komutuyla otomatik üretilir.
// El ile doldurulmuş stub versiyonu — gerçek projede komutla üretiniz:
//   npm run supabase:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      softwares: {
        Row: {
          id: string;
          slug: string;
          canonical_url: string | null;
          name: string;
          tagline: string | null;
          description: string | null;
          short_description: string | null;
          website_url: string | null;
          logo_url: string | null;
          og_image_url: string | null;
          hero_image_url: string | null;
          category_id: string | null;
          pricing_model_id: string | null;
          starting_price: number | null;
          price_currency: string;
          has_free_trial: boolean;
          free_trial_days: number | null;
          pricing_page_url: string | null;
          pricing_notes: string | null;
          developer_name: string | null;
          developer_url: string | null;
          support_url: string | null;
          documentation_url: string | null;
          github_url: string | null;
          twitter_handle: string | null;
          linkedin_url: string | null;
          founded_year: number | null;
          last_major_update: string | null;
          is_discontinued: boolean;
          discontinued_at: string | null;
          replacement_id: string | null;
          meta_title: string | null;
          meta_description: string | null;
          focus_keywords: string[] | null;
          geo_summary: string | null;
          ai_description: string | null;
          schema_type: string;
          review_count: number;
          avg_rating: number | null;
          alternative_count: number;
          view_count: number;
          click_count: number;
          data_quality_score: number | null;
          is_verified: boolean;
          is_featured: boolean;
          is_sponsored: boolean;
          sponsor_sort_boost: number;
          status: "draft" | "review" | "published" | "archived" | "rejected";
          published_at: string | null;
          submitted_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          last_crawled_at: string | null;
          next_crawl_at: string | null;
          crawl_priority: number;
          import_source_id: string | null;
          created_at: string;
          updated_at: string;
          search_vector: unknown | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          status?: "draft" | "review" | "published" | "archived" | "rejected";
          price_currency?: string;
          has_free_trial?: boolean;
          is_discontinued?: boolean;
          review_count?: number;
          alternative_count?: number;
          view_count?: number;
          click_count?: number;
          is_verified?: boolean;
          is_featured?: boolean;
          is_sponsored?: boolean;
          sponsor_sort_boost?: number;
          crawl_priority?: number;
          schema_type?: string;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["softwares"]["Insert"]>;
      };

      categories: {
        Row: {
          id: string;
          slug: string;
          parent_id: string | null;
          icon_url: string | null;
          image_url: string | null;
          sort_order: number;
          software_count: number;
          is_featured: boolean;
          is_active: boolean;
          name: string;
          description: string | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          sort_order?: number;
          software_count?: number;
          is_featured?: boolean;
          is_active?: boolean;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };

      platforms: {
        Row: {
          id: string;
          slug: string;
          name: string;
          icon_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: { id?: string; slug: string; name: string; [key: string]: unknown };
        Update: Partial<Database["public"]["Tables"]["platforms"]["Insert"]>;
      };

      pricing_models: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: { id?: string; slug: string; name: string; [key: string]: unknown };
        Update: Partial<Database["public"]["Tables"]["pricing_models"]["Insert"]>;
      };

      alternatives: {
        Row: {
          id: string;
          software_id: string;
          alternative_id: string;
          similarity_score: number | null;
          migration_score: number | null;
          reason: string | null;
          pros: string[] | null;
          cons: string[] | null;
          difficulty: "easy" | "medium" | "hard" | "expert" | null;
          recommended_for: string[] | null;
          is_editorial: boolean;
          is_approved: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          software_id: string;
          alternative_id: string;
          is_editorial?: boolean;
          is_approved?: boolean;
          sort_order?: number;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["alternatives"]["Insert"]>;
      };

      software_reviews: {
        Row: {
          id: string;
          software_id: string;
          user_id: string | null;
          reviewer_name: string | null;
          reviewer_role: string | null;
          reviewer_avatar: string | null;
          rating: number;
          title: string | null;
          body: string;
          source: string;
          source_url: string | null;
          is_verified: boolean;
          is_featured: boolean;
          is_approved: boolean;
          helpful_count: number;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          software_id: string;
          rating: number;
          body: string;
          source?: string;
          is_verified?: boolean;
          is_featured?: boolean;
          is_approved?: boolean;
          helpful_count?: number;
          locale?: string;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["software_reviews"]["Insert"]>;
      };

      software_faqs: {
        Row: {
          id: string;
          software_id: string;
          question: string;
          answer: string;
          sort_order: number;
          is_featured: boolean;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          software_id: string;
          question: string;
          answer: string;
          sort_order?: number;
          is_featured?: boolean;
          locale?: string;
        };
        Update: Partial<Database["public"]["Tables"]["software_faqs"]["Insert"]>;
      };

      software_screenshots: {
        Row: {
          id: string;
          software_id: string;
          url: string;
          thumb_url: string | null;
          alt_text: string | null;
          caption: string | null;
          width: number | null;
          height: number | null;
          sort_order: number;
          locale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          software_id: string;
          url: string;
          sort_order?: number;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["software_screenshots"]["Insert"]>;
      };

      software_features: {
        Row: {
          id: string;
          software_id: string;
          name: string;
          description: string | null;
          icon_url: string | null;
          is_core: boolean;
          is_unique: boolean;
          sort_order: number;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          software_id: string;
          name: string;
          locale?: string;
          is_core?: boolean;
          is_unique?: boolean;
          sort_order?: number;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["software_features"]["Insert"]>;
      };

      software_pros_cons: {
        Row: {
          id: string;
          software_id: string;
          type: "pro" | "con";
          content: string;
          source: string | null;
          upvotes: number;
          sort_order: number;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          software_id: string;
          type: "pro" | "con";
          content: string;
          locale?: string;
          sort_order?: number;
          upvotes?: number;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["software_pros_cons"]["Insert"]>;
      };

      software_embeddings: {
        Row: {
          id: string;
          software_id: string;
          model: string;
          dimensions: number;
          embedding: number[] | null;
          embedding_768: number[] | null;
          input_text: string | null;
          token_count: number | null;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          software_id: string;
          model?: string;
          dimensions?: number;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["software_embeddings"]["Insert"]>;
      };

      slug_history: {
        Row: {
          id: string;
          old_slug: string;
          new_slug: string;
          entity_type: "software" | "category" | "collection";
          entity_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          old_slug: string;
          new_slug: string;
          entity_type: "software" | "category" | "collection";
          entity_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["slug_history"]["Insert"]>;
      };

      change_logs: {
        Row: {
          id: string;
          software_id: string | null;
          import_source_id: string | null;
          rss_source_id: string | null;
          external_id: string | null;
          source_url: string | null;
          raw_payload: Json;
          normalized_data: Json | null;
          change_type: "create" | "update" | "delete" | "enrich";
          fields_changed: string[] | null;
          diff: Json | null;
          status: "queued" | "processing" | "applied" | "skipped" | "failed" | "duplicate";
          error_message: string | null;
          retry_count: number;
          processed_by: string | null;
          processed_at: string | null;
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          raw_payload: Json;
          change_type: "create" | "update" | "delete" | "enrich";
          status?: "queued" | "processing" | "applied" | "skipped" | "failed" | "duplicate";
          retry_count?: number;
          priority?: number;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["change_logs"]["Insert"]>;
      };

      import_sources: {
        Row: {
          id: string;
          name: string;
          slug: string;
          source_type: "rss" | "api" | "scraper" | "manual" | "csv" | "partner";
          endpoint_url: string | null;
          auth_token: string | null;
          headers: Json | null;
          fetch_interval: number;
          last_fetched_at: string | null;
          next_fetch_at: string | null;
          is_active: boolean;
          success_count: number;
          error_count: number;
          last_error: string | null;
          config: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          source_type: "rss" | "api" | "scraper" | "manual" | "csv" | "partner";
          fetch_interval?: number;
          is_active?: boolean;
          success_count?: number;
          error_count?: number;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["import_sources"]["Insert"]>;
      };

      rss_sources: {
        Row: {
          id: string;
          import_source_id: string;
          feed_url: string;
          feed_type: "rss" | "atom" | "json";
          category_id: string | null;
          language: string;
          item_selector: string | null;
          title_template: string | null;
          is_active: boolean;
          last_etag: string | null;
          last_modified: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          import_source_id: string;
          feed_url: string;
          feed_type?: "rss" | "atom" | "json";
          language?: string;
          is_active?: boolean;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["rss_sources"]["Insert"]>;
      };

      collections: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          cover_image_url: string | null;
          is_featured: boolean;
          is_public: boolean;
          item_count: number;
          created_by: string | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          is_featured?: boolean;
          is_public?: boolean;
          item_count?: number;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>;
      };

      affiliate_links: {
        Row: {
          id: string;
          software_id: string;
          network_id: string | null;
          raw_url: string;
          tracking_url: string;
          label: string | null;
          commission_rate: number | null;
          link_type: "primary" | "trial" | "pricing" | "download";
          is_active: boolean;
          click_count: number;
          conversion_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          software_id: string;
          raw_url: string;
          tracking_url: string;
          link_type?: "primary" | "trial" | "pricing" | "download";
          is_active?: boolean;
          click_count?: number;
          conversion_count?: number;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["affiliate_links"]["Insert"]>;
      };

      search_logs: {
        Row: {
          id: string;
          query: string;
          normalized_query: string | null;
          synonyms_used: string[] | null;
          result_count: number | null;
          top_result_id: string | null;
          latency_ms: number | null;
          session_id: string | null;
          user_id: string | null;
          locale: string;
          ip_hash: string | null;
          user_agent: string | null;
          clicked_result_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          query: string;
          locale?: string;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["search_logs"]["Insert"]>;
      };

      feature_flags: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          rollout_pct: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          is_active?: boolean;
          rollout_pct?: number;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["feature_flags"]["Insert"]>;
      };

      software_translations: {
        Row: {
          id: string;
          software_id: string;
          locale: string;
          name: string | null;
          tagline: string | null;
          description: string | null;
          short_description: string | null;
          meta_title: string | null;
          meta_description: string | null;
          geo_summary: string | null;
          is_machine_translated: boolean;
          translated_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          software_id: string;
          locale: string;
          is_machine_translated?: boolean;
          [key: string]: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["software_translations"]["Insert"]>;
      };

      software_aliases: {
        Row: {
          id: string;
          software_id: string;
          alias: string;
          alias_slug: string;
          is_primary: boolean;
          locale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          software_id: string;
          alias: string;
          alias_slug: string;
          is_primary?: boolean;
          locale?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["software_aliases"]["Insert"]>;
      };

      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "user" | "editor" | "admin" | "superadmin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: "user" | "editor" | "admin" | "superadmin";
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
      };
    };

    Views: {
      mv_software_stats: {
        Row: {
          category_id: string;
          category_name: string;
          category_slug: string;
          total_softwares: number;
          free_count: number;
          featured_count: number;
          avg_rating: number | null;
          total_reviews: number;
          total_alternatives: number;
          last_published_at: string | null;
        };
      };
      mv_top_alternatives: {
        Row: {
          software_id: string;
          alternative_id: string;
          software_name: string;
          software_slug: string;
          alternative_name: string;
          alternative_slug: string;
          alternative_logo: string | null;
          avg_rating: number | null;
          similarity_score: number | null;
          migration_score: number | null;
          rank: number;
        };
      };
    };

    Functions: {
      search_softwares: {
        Args: {
          query_text: string;
          query_embedding?: number[] | null;
          p_category_id?: string | null;
          p_pricing_model_id?: string | null;
          p_platforms?: string[] | null;
          p_locale?: string;
          weight_fts?: number;
          weight_trgm?: number;
          weight_vector?: number;
          weight_popularity?: number;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Array<{
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          short_description: string | null;
          logo_url: string | null;
          category_id: string | null;
          pricing_model_id: string | null;
          starting_price: number | null;
          avg_rating: number | null;
          review_count: number;
          alternative_count: number;
          is_featured: boolean;
          is_sponsored: boolean;
          fts_score: number;
          trgm_score: number;
          vector_score: number;
          popularity_score: number;
          combined_score: number;
        }>;
      };
      get_alternatives_for_software: {
        Args: {
          p_slug: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Array<{
          alternative_id: string;
          alternative_slug: string;
          alternative_name: string;
          alternative_logo: string | null;
          tagline: string | null;
          short_description: string | null;
          avg_rating: number | null;
          review_count: number;
          starting_price: number | null;
          price_currency: string;
          pricing_model_id: string | null;
          similarity_score: number | null;
          migration_score: number | null;
          difficulty: "easy" | "medium" | "hard" | "expert" | null;
          reason: string | null;
          pros: string[] | null;
          cons: string[] | null;
        }>;
      };
      get_software_by_slug: {
        Args: { p_slug: string };
        Returns: Array<{
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          description: string | null;
          short_description: string | null;
          website_url: string | null;
          logo_url: string | null;
          og_image_url: string | null;
          hero_image_url: string | null;
          category_id: string | null;
          pricing_model_id: string | null;
          starting_price: number | null;
          price_currency: string;
          has_free_trial: boolean;
          free_trial_days: number | null;
          pricing_page_url: string | null;
          pricing_notes: string | null;
          developer_name: string | null;
          developer_url: string | null;
          github_url: string | null;
          twitter_handle: string | null;
          founded_year: number | null;
          is_discontinued: boolean;
          meta_title: string | null;
          meta_description: string | null;
          focus_keywords: string[] | null;
          geo_summary: string | null;
          ai_description: string | null;
          review_count: number;
          avg_rating: number | null;
          alternative_count: number;
          view_count: number;
          is_verified: boolean;
          is_featured: boolean;
          is_sponsored: boolean;
          data_quality_score: number | null;
          published_at: string | null;
          category_name: string | null;
          category_slug: string | null;
          pricing_model_name: string | null;
          pricing_model_slug: string | null;
        }>;
      };
      get_featured_softwares: {
        Args: {
          p_category_id?: string | null;
          p_limit?: number;
        };
        Returns: Array<{
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          short_description: string | null;
          logo_url: string | null;
          avg_rating: number | null;
          review_count: number;
          alternative_count: number;
          starting_price: number | null;
          price_currency: string;
          is_sponsored: boolean;
          category_name: string | null;
          category_slug: string | null;
          pricing_model_slug: string | null;
        }>;
      };
      get_software_for_sitemap: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Array<{ slug: string; updated_at: string }>;
      };
      get_comparisons_for_sitemap: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Array<{
          software_slug: string;
          alternative_slug: string;
          updated_at: string;
        }>;
      };
      get_categories_for_sitemap: {
        Args: Record<string, never>;
        Returns: Array<{ slug: string; updated_at: string }>;
      };
      increment_software_view: {
        Args: { p_id: string };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_editor: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };

    Enums: {
      software_status: "draft" | "review" | "published" | "archived" | "rejected";
      pro_con_type: "pro" | "con";
      change_log_status: "queued" | "processing" | "applied" | "skipped" | "failed" | "duplicate";
      editorial_status: "draft" | "ready_for_review" | "in_review" | "approved" | "published" | "rejected" | "archived";
    };
  };
};
