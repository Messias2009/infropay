export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          bank_name: string
          created_at: string
          holder_name: string
          iban: string
          id: string
          is_default: boolean
          phone: string | null
          producer_id: string
          updated_at: string
        }
        Insert: {
          bank_name: string
          created_at?: string
          holder_name: string
          iban: string
          id?: string
          is_default?: boolean
          phone?: string | null
          producer_id: string
          updated_at?: string
        }
        Update: {
          bank_name?: string
          created_at?: string
          holder_name?: string
          iban?: string
          id?: string
          is_default?: boolean
          phone?: string | null
          producer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          banner_url: string | null
          category_id: string | null
          cover_url: string | null
          created_at: string
          currency: string
          description: string | null
          external_url: string | null
          file_url: string | null
          ga_measurement_id: string | null
          google_ads_label: string | null
          guarantee_days: number | null
          id: string
          meta_pixel_id: string | null
          price_cents: number
          producer_id: string
          product_type: Database["public"]["Enums"]["product_type"]
          promo_price_cents: number | null
          rating: number | null
          rejection_reason: string | null
          reviews_count: number
          sales_count: number
          sales_video_url: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          tags: string[] | null
          title: string
          updated_at: string
          utmify_token: string | null
          views_count: number
        }
        Insert: {
          banner_url?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          ga_measurement_id?: string | null
          google_ads_label?: string | null
          guarantee_days?: number | null
          id?: string
          meta_pixel_id?: string | null
          price_cents?: number
          producer_id: string
          product_type?: Database["public"]["Enums"]["product_type"]
          promo_price_cents?: number | null
          rating?: number | null
          rejection_reason?: string | null
          reviews_count?: number
          sales_count?: number
          sales_video_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          utmify_token?: string | null
          views_count?: number
        }
        Update: {
          banner_url?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          ga_measurement_id?: string | null
          google_ads_label?: string | null
          guarantee_days?: number | null
          id?: string
          meta_pixel_id?: string | null
          price_cents?: number
          producer_id?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          promo_price_cents?: number | null
          rating?: number | null
          rejection_reason?: string | null
          reviews_count?: number
          sales_count?: number
          sales_video_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          utmify_token?: string | null
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          full_name: string | null
          id: string
          social_instagram: string | null
          social_website: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          social_instagram?: string | null
          social_website?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          social_instagram?: string | null
          social_website?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          access_token: string
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          buyer_user_id: string | null
          created_at: string
          currency: string
          gross_cents: number
          id: string
          net_cents: number
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_ref: string | null
          platform_fee_cents: number
          producer_id: string
          product_id: string
          provider: string | null
          release_at: string | null
          released: boolean
          status: Database["public"]["Enums"]["sale_status"]
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          buyer_user_id?: string | null
          created_at?: string
          currency?: string
          gross_cents: number
          id?: string
          net_cents: number
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_ref?: string | null
          platform_fee_cents?: number
          producer_id: string
          product_id: string
          provider?: string | null
          release_at?: string | null
          released?: boolean
          status?: Database["public"]["Enums"]["sale_status"]
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          buyer_user_id?: string | null
          created_at?: string
          currency?: string
          gross_cents?: number
          id?: string
          net_cents?: number
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_ref?: string | null
          platform_fee_cents?: number
          producer_id?: string
          product_id?: string
          provider?: string | null
          release_at?: string | null
          released?: boolean
          status?: Database["public"]["Enums"]["sale_status"]
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          ga_measurement_id: string | null
          google_ads_id: string | null
          google_ads_label: string | null
          meta_capi_token: string | null
          meta_pixel_id: string | null
          updated_at: string
          user_id: string
          utmify_token: string | null
        }
        Insert: {
          ga_measurement_id?: string | null
          google_ads_id?: string | null
          google_ads_label?: string | null
          meta_capi_token?: string | null
          meta_pixel_id?: string | null
          updated_at?: string
          user_id: string
          utmify_token?: string | null
        }
        Update: {
          ga_measurement_id?: string | null
          google_ads_id?: string | null
          google_ads_label?: string | null
          meta_capi_token?: string | null
          meta_pixel_id?: string | null
          updated_at?: string
          user_id?: string
          utmify_token?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          available_cents: number
          currency: string
          pending_cents: number
          producer_id: string
          updated_at: string
        }
        Insert: {
          available_cents?: number
          currency?: string
          pending_cents?: number
          producer_id: string
          updated_at?: string
        }
        Update: {
          available_cents?: number
          currency?: string
          pending_cents?: number
          producer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_id: string
          id: string
          payload: Json
          processed_at: string
          provider: string
        }
        Insert: {
          event_id: string
          id?: string
          payload: Json
          processed_at?: string
          provider: string
        }
        Update: {
          event_id?: string
          id?: string
          payload?: Json
          processed_at?: string
          provider?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          bank_account_id: string
          created_at: string
          currency: string
          fee_cents: number
          gross_cents: number
          id: string
          net_cents: number
          processed_at: string | null
          producer_id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
        }
        Insert: {
          bank_account_id: string
          created_at?: string
          currency?: string
          fee_cents: number
          gross_cents: number
          id?: string
          net_cents: number
          processed_at?: string | null
          producer_id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
        }
        Update: {
          bank_account_id?: string
          created_at?: string
          currency?: string
          fee_cents?: number
          gross_cents?: number
          id?: string
          net_cents?: number
          processed_at?: string | null
          producer_id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_admin: { Args: never; Returns: boolean }
      ensure_wallet: { Args: { _uid: string }; Returns: undefined }
      fmt_kz: { Args: { _cents: number }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      release_matured_sales: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "producer" | "buyer"
      payment_method: "multicaixa_express" | "referencia" | "transferencia"
      product_status: "rascunho" | "publicado" | "pausado" | "em_analise"
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
        | "download"
      sale_status: "pendente" | "pago" | "reembolsado" | "cancelado"
      withdrawal_status: "em_analise" | "aprovado" | "pago" | "recusado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "producer", "buyer"],
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
} as const
