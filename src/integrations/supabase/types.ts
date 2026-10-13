export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string;
          admin_id: string | null;
          admin_name: string | null;
          created_at: string;
          details: Json;
          id: string;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action: string;
          admin_id?: string | null;
          admin_name?: string | null;
          created_at?: string;
          details?: Json;
          id?: string;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action?: string;
          admin_id?: string | null;
          admin_name?: string | null;
          created_at?: string;
          details?: Json;
          id?: string;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [];
      };
      affiliate_links: {
        Row: {
          affiliate_id: string;
          clicks: number;
          code: string;
          created_at: string;
          id: string;
          product_id: string;
          updated_at: string;
        };
        Insert: {
          affiliate_id: string;
          clicks?: number;
          code: string;
          created_at?: string;
          id?: string;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          affiliate_id?: string;
          clicks?: number;
          code?: string;
          created_at?: string;
          id?: string;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_links_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      bank_accounts: {
        Row: {
          bank_name: string;
          created_at: string;
          holder_name: string;
          iban: string;
          id: string;
          is_default: boolean;
          phone: string | null;
          producer_id: string;
          updated_at: string;
        };
        Insert: {
          bank_name: string;
          created_at?: string;
          holder_name: string;
          iban: string;
          id?: string;
          is_default?: boolean;
          phone?: string | null;
          producer_id: string;
          updated_at?: string;
        };
        Update: {
          bank_name?: string;
          created_at?: string;
          holder_name?: string;
          iban?: string;
          id?: string;
          is_default?: boolean;
          phone?: string | null;
          producer_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          discount_kind: Database["public"]["Enums"]["discount_kind"];
          discount_value: number;
          expires_at: string | null;
          id: string;
          max_uses: number | null;
          producer_id: string;
          product_id: string | null;
          updated_at: string;
          uses_count: number;
        };
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          discount_kind?: Database["public"]["Enums"]["discount_kind"];
          discount_value: number;
          expires_at?: string | null;
          id?: string;
          max_uses?: number | null;
          producer_id: string;
          product_id?: string | null;
          updated_at?: string;
          uses_count?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          discount_kind?: Database["public"]["Enums"]["discount_kind"];
          discount_value?: number;
          expires_at?: string | null;
          id?: string;
          max_uses?: number | null;
          producer_id?: string;
          product_id?: string | null;
          updated_at?: string;
          uses_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "coupons_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      course_lessons: {
        Row: {
          attachment_url: string | null;
          created_at: string;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          is_free: boolean;
          module_id: string;
          producer_id: string;
          sort_order: number;
          title: string;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          attachment_url?: string | null;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_free?: boolean;
          module_id: string;
          producer_id: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          attachment_url?: string | null;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_free?: boolean;
          module_id?: string;
          producer_id?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "course_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      course_modules: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          producer_id: string;
          product_id: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          producer_id: string;
          product_id: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          producer_id?: string;
          product_id?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_modules_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          certificate_issued: boolean;
          completed_at: string | null;
          created_at: string;
          id: string;
          product_id: string;
          progress_percent: number;
          sale_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          certificate_issued?: boolean;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          product_id: string;
          progress_percent?: number;
          sale_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          certificate_issued?: boolean;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          product_id?: string;
          progress_percent?: number;
          sale_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: {
          completed: boolean;
          created_at: string;
          id: string;
          lesson_id: string;
          seconds_watched: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          lesson_id: string;
          seconds_watched?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          lesson_id?: string;
          seconds_watched?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "course_lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link: string | null;
          metadata: Json;
          read: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          metadata?: Json;
          read?: boolean;
          title: string;
          type?: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          metadata?: Json;
          read?: boolean;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      order_bumps: {
        Row: {
          bump_product_id: string;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          product_id: string;
          promo_price_cents: number;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          bump_product_id: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          product_id: string;
          promo_price_cents: number;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          bump_product_id?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          product_id?: string;
          promo_price_cents?: number;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_bumps_bump_product_id_fkey";
            columns: ["bump_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_bumps_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_offers: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          headline: string | null;
          id: string;
          kind: Database["public"]["Enums"]["offer_kind"];
          offer_price_cents: number;
          offer_product_id: string;
          producer_id: string;
          product_id: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          headline?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["offer_kind"];
          offer_price_cents: number;
          offer_product_id: string;
          producer_id: string;
          product_id: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          headline?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["offer_kind"];
          offer_price_cents?: number;
          offer_product_id?: string;
          producer_id?: string;
          product_id?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_offers_offer_product_id_fkey";
            columns: ["offer_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_offers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          affiliate_commission_percent: number;
          allow_affiliates: boolean;
          app_package: string | null;
          app_requirements: string | null;
          app_version: string | null;
          banner_url: string | null;
          billing_interval: Database["public"]["Enums"]["billing_interval"] | null;
          category_id: string | null;
          checkout_banner_url: string | null;
          checkout_brand_name: string | null;
          checkout_logo_url: string | null;
          checkout_theme: string;
          cover_url: string | null;
          created_at: string;
          currency: string;
          delivery_kind: Database["public"]["Enums"]["delivery_kind"];
          description: string | null;
          external_url: string | null;
          file_url: string | null;
          ga_measurement_id: string | null;
          google_ads_label: string | null;
          guarantee_days: number | null;
          has_members_area: boolean;
          id: string;
          is_subscription: boolean;
          meta_pixel_id: string | null;
          price_cents: number;
          producer_id: string;
          product_type: Database["public"]["Enums"]["product_type"];
          promo_price_cents: number | null;
          rating: number | null;
          rejection_reason: string | null;
          requires_shipping: boolean;
          reviews_count: number;
          sales_count: number;
          sales_video_url: string | null;
          seo_description: string | null;
          seo_title: string | null;
          shipping_fee_cents: number;
          short_description: string | null;
          slug: string;
          status: Database["public"]["Enums"]["product_status"];
          stock_quantity: number | null;
          store_visible: boolean;
          subscription_price_cents: number | null;
          tags: string[] | null;
          title: string;
          trial_days: number;
          updated_at: string;
          utmify_token: string | null;
          views_count: number;
          weight_grams: number | null;
        };
        Insert: {
          affiliate_commission_percent?: number;
          allow_affiliates?: boolean;
          app_package?: string | null;
          app_requirements?: string | null;
          app_version?: string | null;
          banner_url?: string | null;
          billing_interval?: Database["public"]["Enums"]["billing_interval"] | null;
          category_id?: string | null;
          checkout_banner_url?: string | null;
          checkout_brand_name?: string | null;
          checkout_logo_url?: string | null;
          checkout_theme?: string;
          cover_url?: string | null;
          created_at?: string;
          currency?: string;
          delivery_kind?: Database["public"]["Enums"]["delivery_kind"];
          description?: string | null;
          external_url?: string | null;
          file_url?: string | null;
          ga_measurement_id?: string | null;
          google_ads_label?: string | null;
          guarantee_days?: number | null;
          has_members_area?: boolean;
          id?: string;
          is_subscription?: boolean;
          meta_pixel_id?: string | null;
          price_cents?: number;
          producer_id: string;
          product_type?: Database["public"]["Enums"]["product_type"];
          promo_price_cents?: number | null;
          rating?: number | null;
          rejection_reason?: string | null;
          requires_shipping?: boolean;
          reviews_count?: number;
          sales_count?: number;
          sales_video_url?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          shipping_fee_cents?: number;
          short_description?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["product_status"];
          stock_quantity?: number | null;
          store_visible?: boolean;
          subscription_price_cents?: number | null;
          tags?: string[] | null;
          title: string;
          trial_days?: number;
          updated_at?: string;
          utmify_token?: string | null;
          views_count?: number;
          weight_grams?: number | null;
        };
        Update: {
          affiliate_commission_percent?: number;
          allow_affiliates?: boolean;
          app_package?: string | null;
          app_requirements?: string | null;
          app_version?: string | null;
          banner_url?: string | null;
          billing_interval?: Database["public"]["Enums"]["billing_interval"] | null;
          category_id?: string | null;
          checkout_banner_url?: string | null;
          checkout_brand_name?: string | null;
          checkout_logo_url?: string | null;
          checkout_theme?: string;
          cover_url?: string | null;
          created_at?: string;
          currency?: string;
          delivery_kind?: Database["public"]["Enums"]["delivery_kind"];
          description?: string | null;
          external_url?: string | null;
          file_url?: string | null;
          ga_measurement_id?: string | null;
          google_ads_label?: string | null;
          guarantee_days?: number | null;
          has_members_area?: boolean;
          id?: string;
          is_subscription?: boolean;
          meta_pixel_id?: string | null;
          price_cents?: number;
          producer_id?: string;
          product_type?: Database["public"]["Enums"]["product_type"];
          promo_price_cents?: number | null;
          rating?: number | null;
          rejection_reason?: string | null;
          requires_shipping?: boolean;
          reviews_count?: number;
          sales_count?: number;
          sales_video_url?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          shipping_fee_cents?: number;
          short_description?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["product_status"];
          stock_quantity?: number | null;
          store_visible?: boolean;
          subscription_price_cents?: number | null;
          tags?: string[] | null;
          title?: string;
          trial_days?: number;
          updated_at?: string;
          utmify_token?: string | null;
          views_count?: number;
          weight_grams?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_producer_id_fkey";
            columns: ["producer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          ban_reason: string | null;
          banned_at: string | null;
          bio: string | null;
          cover_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          is_banned: boolean;
          social_instagram: string | null;
          social_website: string | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          ban_reason?: string | null;
          banned_at?: string | null;
          bio?: string | null;
          cover_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          is_banned?: boolean;
          social_instagram?: string | null;
          social_website?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          ban_reason?: string | null;
          banned_at?: string | null;
          bio?: string | null;
          cover_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          is_banned?: boolean;
          social_instagram?: string | null;
          social_website?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      sales: {
        Row: {
          access_token: string;
          affiliate_code: string | null;
          affiliate_commission_cents: number;
          affiliate_id: string | null;
          buyer_email: string | null;
          buyer_name: string | null;
          buyer_phone: string | null;
          buyer_user_id: string | null;
          coupon_code: string | null;
          created_at: string;
          currency: string;
          discount_cents: number;
          gross_cents: number;
          id: string;
          net_cents: number;
          origin: string;
          paid_at: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_ref: string | null;
          platform_fee_cents: number;
          producer_id: string;
          product_id: string;
          provider: string | null;
          release_at: string | null;
          released: boolean;
          status: Database["public"]["Enums"]["sale_status"];
          stripe_session_id: string | null;
          updated_at: string;
        };
        Insert: {
          access_token?: string;
          affiliate_code?: string | null;
          affiliate_commission_cents?: number;
          affiliate_id?: string | null;
          buyer_email?: string | null;
          buyer_name?: string | null;
          buyer_phone?: string | null;
          buyer_user_id?: string | null;
          coupon_code?: string | null;
          created_at?: string;
          currency?: string;
          discount_cents?: number;
          gross_cents: number;
          id?: string;
          net_cents: number;
          origin?: string;
          paid_at?: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_ref?: string | null;
          platform_fee_cents?: number;
          producer_id: string;
          product_id: string;
          provider?: string | null;
          release_at?: string | null;
          released?: boolean;
          status?: Database["public"]["Enums"]["sale_status"];
          stripe_session_id?: string | null;
          updated_at?: string;
        };
        Update: {
          access_token?: string;
          affiliate_code?: string | null;
          affiliate_commission_cents?: number;
          affiliate_id?: string | null;
          buyer_email?: string | null;
          buyer_name?: string | null;
          buyer_phone?: string | null;
          buyer_user_id?: string | null;
          coupon_code?: string | null;
          created_at?: string;
          currency?: string;
          discount_cents?: number;
          gross_cents?: number;
          id?: string;
          net_cents?: number;
          origin?: string;
          paid_at?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          payment_ref?: string | null;
          platform_fee_cents?: number;
          producer_id?: string;
          product_id?: string;
          provider?: string | null;
          release_at?: string | null;
          released?: boolean;
          status?: Database["public"]["Enums"]["sale_status"];
          stripe_session_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      user_integrations: {
        Row: {
          ga_measurement_id: string | null;
          google_ads_id: string | null;
          google_ads_label: string | null;
          meta_capi_token: string | null;
          meta_pixel_id: string | null;
          updated_at: string;
          user_id: string;
          utmify_token: string | null;
        };
        Insert: {
          ga_measurement_id?: string | null;
          google_ads_id?: string | null;
          google_ads_label?: string | null;
          meta_capi_token?: string | null;
          meta_pixel_id?: string | null;
          updated_at?: string;
          user_id: string;
          utmify_token?: string | null;
        };
        Update: {
          ga_measurement_id?: string | null;
          google_ads_id?: string | null;
          google_ads_label?: string | null;
          meta_capi_token?: string | null;
          meta_pixel_id?: string | null;
          updated_at?: string;
          user_id?: string;
          utmify_token?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          available_cents: number;
          currency: string;
          pending_cents: number;
          producer_id: string;
          updated_at: string;
        };
        Insert: {
          available_cents?: number;
          currency?: string;
          pending_cents?: number;
          producer_id: string;
          updated_at?: string;
        };
        Update: {
          available_cents?: number;
          currency?: string;
          pending_cents?: number;
          producer_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          event_id: string;
          id: string;
          payload: Json;
          processed_at: string;
          provider: string;
        };
        Insert: {
          event_id: string;
          id?: string;
          payload: Json;
          processed_at?: string;
          provider: string;
        };
        Update: {
          event_id?: string;
          id?: string;
          payload?: Json;
          processed_at?: string;
          provider?: string;
        };
        Relationships: [];
      };
      withdrawals: {
        Row: {
          bank_account_id: string;
          created_at: string;
          currency: string;
          fee_cents: number;
          gross_cents: number;
          id: string;
          net_cents: number;
          processed_at: string | null;
          producer_id: string;
          rejection_reason: string | null;
          status: Database["public"]["Enums"]["withdrawal_status"];
          updated_at: string;
        };
        Insert: {
          bank_account_id: string;
          created_at?: string;
          currency?: string;
          fee_cents: number;
          gross_cents: number;
          id?: string;
          net_cents: number;
          processed_at?: string | null;
          producer_id: string;
          rejection_reason?: string | null;
          status?: Database["public"]["Enums"]["withdrawal_status"];
          updated_at?: string;
        };
        Update: {
          bank_account_id?: string;
          created_at?: string;
          currency?: string;
          fee_cents?: number;
          gross_cents?: number;
          id?: string;
          net_cents?: number;
          processed_at?: string | null;
          producer_id?: string;
          rejection_reason?: string | null;
          status?: Database["public"]["Enums"]["withdrawal_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "withdrawals_bank_account_id_fkey";
            columns: ["bank_account_id"];
            isOneToOne: false;
            referencedRelation: "bank_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      bootstrap_admin: { Args: never; Returns: boolean };
      ensure_wallet: { Args: { _uid: string }; Returns: undefined };
      fmt_kz: { Args: { _cents: number }; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_user_banned: { Args: { _user_id: string }; Returns: boolean };
      register_affiliate_click: { Args: { _code: string }; Returns: undefined };
      release_matured_sales: { Args: never; Returns: number };
    };
    Enums: {
      app_role: "admin" | "producer" | "buyer";
      billing_interval: "mensal" | "trimestral" | "semestral" | "anual";
      delivery_kind: "digital" | "fisico" | "apk" | "assinatura" | "membros" | "externo";
      discount_kind: "percentagem" | "valor";
      offer_kind: "order_bump" | "upsell" | "downsell";
      payment_method: "multicaixa_express" | "referencia" | "transferencia";
      product_status: "rascunho" | "publicado" | "pausado" | "em_analise";
      product_type:
        | "ebook"
        | "curso"
        | "pdf"
        | "video"
        | "software"
        | "link_externo"
        | "streaming"
        | "assinatura"
        | "template"
        | "ia"
        | "comunidade"
        | "download";
      sale_status: "pendente" | "pago" | "reembolsado" | "cancelado";
      withdrawal_status: "em_analise" | "aprovado" | "pago" | "recusado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "producer", "buyer"],
      billing_interval: ["mensal", "trimestral", "semestral", "anual"],
      delivery_kind: ["digital", "fisico", "apk", "assinatura", "membros", "externo"],
      discount_kind: ["percentagem", "valor"],
      offer_kind: ["order_bump", "upsell", "downsell"],
      payment_method: ["multicaixa_express", "referencia", "transferencia"],
      product_status: ["rascunho", "publicado", "pausado", "em_analise"],
      product_type: [
        "ebook",
        "curso",
        "pdf",
        "video",
        "software",
        "link_externo",
        "streaming",
        "assinatura",
        "template",
        "ia",
        "comunidade",
        "download",
      ],
      sale_status: ["pendente", "pago", "reembolsado", "cancelado"],
      withdrawal_status: ["em_analise", "aprovado", "pago", "recusado"],
    },
  },
} as const;
