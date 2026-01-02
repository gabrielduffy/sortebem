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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          code: string
          created_at: string | null
          id: number
          is_winner: boolean | null
          numbers: number[]
          purchase_id: number | null
          round_id: number
          status: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: number
          is_winner?: boolean | null
          numbers: number[]
          purchase_id?: number | null
          round_id: number
          status?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: number
          is_winner?: boolean | null
          numbers?: number[]
          purchase_id?: number | null
          round_id?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      charities: {
        Row: {
          active_month: string | null
          created_at: string | null
          description: string | null
          id: number
          instagram: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          pix_key: string | null
          total_raised: number | null
          total_received: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          active_month?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          instagram?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          pix_key?: string | null
          total_raised?: number | null
          total_received?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          active_month?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          instagram?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          pix_key?: string | null
          total_raised?: number | null
          total_received?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      draws: {
        Row: {
          drawn_at: string | null
          id: number
          number: number
          position: number
          round_id: number
        }
        Insert: {
          drawn_at?: string | null
          id?: number
          number: number
          position: number
          round_id: number
        }
        Update: {
          drawn_at?: string | null
          id?: number
          number?: number
          position?: number
          round_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "draws_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          address: string | null
          auth_id: string | null
          balance: number | null
          city: string | null
          cnpj: string | null
          code: string
          commission_rate: number | null
          created_at: string | null
          id: number
          is_active: boolean | null
          kyc_status: string | null
          logo_url: string | null
          manager_id: number | null
          name: string
          phone: string | null
          slug: string
          state: string | null
          total_commission: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          address?: string | null
          auth_id?: string | null
          balance?: number | null
          city?: string | null
          cnpj?: string | null
          code: string
          commission_rate?: number | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          kyc_status?: string | null
          logo_url?: string | null
          manager_id?: number | null
          name: string
          phone?: string | null
          slug: string
          state?: string | null
          total_commission?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          address?: string | null
          auth_id?: string | null
          balance?: number | null
          city?: string | null
          cnpj?: string | null
          code?: string
          commission_rate?: number | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          kyc_status?: string | null
          logo_url?: string | null
          manager_id?: number | null
          name?: string
          phone?: string | null
          slug?: string
          state?: string | null
          total_commission?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "establishments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      groq_prompts: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: number | null
          description: string | null
          id: number
          is_active: boolean | null
          max_tokens: number | null
          model: string
          name: string
          system_prompt: string
          temperature: number | null
          updated_at: string | null
          user_prompt_template: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string
          name: string
          system_prompt: string
          temperature?: number | null
          updated_at?: string | null
          user_prompt_template: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string
          name?: string
          system_prompt?: string
          temperature?: number | null
          updated_at?: string | null
          user_prompt_template?: string
        }
        Relationships: []
      }
      groq_usage_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          establishment_id: number | null
          id: number
          model: string
          prompt_id: number | null
          prompt_name: string | null
          request_payload: Json
          response_payload: Json | null
          success: boolean | null
          tokens_completion: number | null
          tokens_prompt: number | null
          tokens_total: number | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          establishment_id?: number | null
          id?: number
          model: string
          prompt_id?: number | null
          prompt_name?: string | null
          request_payload: Json
          response_payload?: Json | null
          success?: boolean | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
          tokens_total?: number | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          establishment_id?: number | null
          id?: number
          model?: string
          prompt_id?: number | null
          prompt_name?: string | null
          request_payload?: Json
          response_payload?: Json | null
          success?: boolean | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
          tokens_total?: number | null
          user_id?: number | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: number | null
          entity_type: string | null
          id: number
          ip_address: string | null
          user_agent: string | null
          user_id: number | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: number | null
          entity_type?: string | null
          id?: number
          ip_address?: string | null
          user_agent?: string | null
          user_id?: number | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: number | null
          entity_type?: string | null
          id?: number
          ip_address?: string | null
          user_agent?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      managers: {
        Row: {
          auth_id: string | null
          balance: number | null
          code: string
          commission_rate: number | null
          cpf: string | null
          created_at: string | null
          id: number
          is_active: boolean | null
          kyc_status: string | null
          referral_code: string | null
          total_commission: number | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          auth_id?: string | null
          balance?: number | null
          code: string
          commission_rate?: number | null
          cpf?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          kyc_status?: string | null
          referral_code?: string | null
          total_commission?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          auth_id?: string | null
          balance?: number | null
          code?: string
          commission_rate?: number | null
          cpf?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          kyc_status?: string | null
          referral_code?: string | null
          total_commission?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "managers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          gateway: string
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          purchase_id: number | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          gateway: string
          id?: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          purchase_id?: number | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          gateway?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          purchase_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      player_participations: {
        Row: {
          created_at: string | null
          id: number
          is_winner: boolean | null
          participated_at: string | null
          player_id: number
          prize_amount: number | null
          purchase_id: number | null
          quantity: number
          round_id: number
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_winner?: boolean | null
          participated_at?: string | null
          player_id: number
          prize_amount?: number | null
          purchase_id?: number | null
          quantity?: number
          round_id: number
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_winner?: boolean | null
          participated_at?: string | null
          player_id?: number
          prize_amount?: number | null
          purchase_id?: number | null
          quantity?: number
          round_id?: number
          total_amount?: number | null
        }
        Relationships: []
      }
      players: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string | null
          created_by: number | null
          email: string | null
          establishment_id: number
          id: number
          is_bot: boolean | null
          metadata: Json | null
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: number | null
          email?: string | null
          establishment_id: number
          id?: number
          is_bot?: boolean | null
          metadata?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: number | null
          email?: string | null
          establishment_id?: number
          id?: number
          is_bot?: boolean | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pos_terminals: {
        Row: {
          active: boolean | null
          api_key: string
          api_key_hash: string
          created_at: string | null
          establishment_id: number
          id: number
          is_active: boolean | null
          last_heartbeat: string | null
          name: string | null
          terminal_code: string
          terminal_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          api_key: string
          api_key_hash: string
          created_at?: string | null
          establishment_id: number
          id?: number
          is_active?: boolean | null
          last_heartbeat?: string | null
          name?: string | null
          terminal_code: string
          terminal_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          api_key?: string
          api_key_hash?: string
          created_at?: string | null
          establishment_id?: number
          id?: number
          is_active?: boolean | null
          last_heartbeat?: string | null
          name?: string | null
          terminal_code?: string
          terminal_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_terminals_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          asaas_charge_id: string | null
          asaas_customer_id: string | null
          cards_generated: boolean | null
          cards_generated_at: string | null
          created_at: string | null
          customer_cpf: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          establishment_id: number | null
          gateway: string | null
          id: number
          paid_at: string | null
          payment_confirmed: boolean | null
          payment_method: string
          payment_status: string
          pix_code: string | null
          pix_expiration: string | null
          pix_qr_code: string | null
          pix_qrcode: string | null
          quantity: number
          round_id: number
          total_amount: number
          transaction_code: string | null
          unit_price: number
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          asaas_charge_id?: string | null
          asaas_customer_id?: string | null
          cards_generated?: boolean | null
          cards_generated_at?: string | null
          created_at?: string | null
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          establishment_id?: number | null
          gateway?: string | null
          id?: number
          paid_at?: string | null
          payment_confirmed?: boolean | null
          payment_method: string
          payment_status?: string
          pix_code?: string | null
          pix_expiration?: string | null
          pix_qr_code?: string | null
          pix_qrcode?: string | null
          quantity: number
          round_id: number
          total_amount: number
          transaction_code?: string | null
          unit_price: number
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          asaas_charge_id?: string | null
          asaas_customer_id?: string | null
          cards_generated?: boolean | null
          cards_generated_at?: string | null
          created_at?: string | null
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          establishment_id?: number | null
          gateway?: string | null
          id?: number
          paid_at?: string | null
          payment_confirmed?: boolean | null
          payment_method?: string
          payment_status?: string
          pix_code?: string | null
          pix_expiration?: string | null
          pix_qr_code?: string | null
          pix_qrcode?: string | null
          quantity?: number
          round_id?: number
          total_amount?: number
          transaction_code?: string | null
          unit_price?: number
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          allow_late_entry: boolean | null
          card_price: number
          cards_sold: number | null
          charity_amount: number | null
          commission_amount: number | null
          created_at: string | null
          draw_time: string | null
          drawing_started_at: string | null
          drawn_numbers: number[] | null
          ends_at: string
          finished_at: string | null
          id: number
          is_selling: boolean | null
          late_entry_cutoff_minutes: number | null
          manual_creation: boolean | null
          max_cards: number
          max_participants: number | null
          min_participants: number | null
          number: number
          platform_amount: number | null
          prize_pool: number | null
          selling_ends_at: string
          starts_at: string
          status: string
          tiebreak_rule: string | null
          type: string
          updated_at: string | null
          winner_criteria: string | null
        }
        Insert: {
          allow_late_entry?: boolean | null
          card_price: number
          cards_sold?: number | null
          charity_amount?: number | null
          commission_amount?: number | null
          created_at?: string | null
          draw_time?: string | null
          drawing_started_at?: string | null
          drawn_numbers?: number[] | null
          ends_at: string
          finished_at?: string | null
          id?: number
          is_selling?: boolean | null
          late_entry_cutoff_minutes?: number | null
          manual_creation?: boolean | null
          max_cards?: number
          max_participants?: number | null
          min_participants?: number | null
          number: number
          platform_amount?: number | null
          prize_pool?: number | null
          selling_ends_at: string
          starts_at: string
          status?: string
          tiebreak_rule?: string | null
          type: string
          updated_at?: string | null
          winner_criteria?: string | null
        }
        Update: {
          allow_late_entry?: boolean | null
          card_price?: number
          cards_sold?: number | null
          charity_amount?: number | null
          commission_amount?: number | null
          created_at?: string | null
          draw_time?: string | null
          drawing_started_at?: string | null
          drawn_numbers?: number[] | null
          ends_at?: string
          finished_at?: string | null
          id?: number
          is_selling?: boolean | null
          late_entry_cutoff_minutes?: number | null
          manual_creation?: boolean | null
          max_cards?: number
          max_participants?: number | null
          min_participants?: number | null
          number?: number
          platform_amount?: number | null
          prize_pool?: number | null
          selling_ends_at?: string
          starts_at?: string
          status?: string
          tiebreak_rule?: string | null
          type?: string
          updated_at?: string | null
          winner_criteria?: string | null
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          description: string
          executed_at: string | null
          version: number
        }
        Insert: {
          description: string
          executed_at?: string | null
          version: number
        }
        Update: {
          description?: string
          executed_at?: string | null
          version?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      ticker_messages: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          message: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: number
          is_active: boolean
          name: string
          password_hash: string
          password_hash_new: string | null
          password_migrated: boolean | null
          phone: string | null
          role: string
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          auth_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: number
          is_active?: boolean
          name: string
          password_hash?: string
          password_hash_new?: string | null
          password_migrated?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          auth_id?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: number
          is_active?: boolean
          name?: string
          password_hash?: string
          password_hash_new?: string | null
          password_migrated?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      winners: {
        Row: {
          card_code: string
          card_id: number
          claimed_at: string | null
          created_at: string | null
          id: number
          paid_at: string | null
          pattern: string
          pattern_matched: Json | null
          pix_key: string | null
          prize_amount: number
          round_id: number
          status: string | null
          tiebreak_stone: number | null
        }
        Insert: {
          card_code: string
          card_id: number
          claimed_at?: string | null
          created_at?: string | null
          id?: number
          paid_at?: string | null
          pattern: string
          pattern_matched?: Json | null
          pix_key?: string | null
          prize_amount: number
          round_id: number
          status?: string | null
          tiebreak_stone?: number | null
        }
        Update: {
          card_code?: string
          card_id?: number
          claimed_at?: string | null
          created_at?: string | null
          id?: number
          paid_at?: string | null
          pattern?: string
          pattern_matched?: Json | null
          pix_key?: string | null
          prize_amount?: number
          round_id?: number
          status?: string | null
          tiebreak_stone?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "winners_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string | null
          entity_id: number
          id: number
          pix_key: string
          processed_at: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: number
          user_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          entity_id: number
          id?: number
          pix_key: string
          processed_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id: number
          user_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          entity_id?: number
          id?: number
          pix_key?: string
          processed_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: number
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_groq_usage_stats: {
        Row: {
          avg_duration_ms: number | null
          avg_tokens_per_request: number | null
          date: string | null
          failed_requests: number | null
          first_request: string | null
          last_request: string | null
          model: string | null
          prompt_name: string | null
          successful_requests: number | null
          total_requests: number | null
          total_tokens: number | null
        }
        Relationships: []
      }
      v_player_stats: {
        Row: {
          created_at: string | null
          email: string | null
          establishment_id: number | null
          id: number | null
          is_bot: boolean | null
          last_participation: string | null
          name: string | null
          phone: string | null
          recent_participations: Json | null
          tags: string[] | null
          total_cards_purchased: number | null
          total_participations: number | null
          total_prizes_won: number | null
          total_spent: number | null
          total_wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_player_to_round: {
        Args: {
          p_player_id: number
          p_quantity?: number
          p_round_id: number
          p_total_amount?: number
        }
        Returns: number
      }
      authenticate_user: {
        Args: { p_email: string; p_password: string }
        Returns: {
          message: string
          success: boolean
          user_email: string
          user_id: number
          user_name: string
          user_role: string
        }[]
      }
      auto_open_scheduled_rounds: { Args: never; Returns: number }
      create_manual_round: {
        Args: {
          p_card_price: number
          p_created_by?: number
          p_description?: string
          p_draw_date: string
          p_draw_time: string
          p_establishment_id: number
          p_max_participants?: number
          p_min_participants?: number
          p_prize: number
          p_tiebreak_rule?: string
          p_type?: string
          p_winner_criteria?: string
        }
        Returns: Json
      }
      create_next_rounds: { Args: never; Returns: undefined }
      create_players_batch: {
        Args: {
          p_created_by?: number
          p_establishment_id: number
          p_is_bot?: boolean
          p_names: string[]
        }
        Returns: {
          created: boolean
          id: number
          name: string
        }[]
      }
      get_user_id_by_auth: { Args: { p_auth_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: number
        }
        Returns: boolean
      }
      hash_password: { Args: { password: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      log_groq_usage: {
        Args: {
          p_duration_ms: number
          p_error_message?: string
          p_establishment_id: number
          p_model: string
          p_prompt_id: number
          p_prompt_name: string
          p_request: Json
          p_response: Json
          p_success: boolean
          p_tokens_completion: number
          p_tokens_prompt: number
          p_user_id: number
        }
        Returns: number
      }
      migrate_user_password: {
        Args: { p_new_password: string; p_user_id: number }
        Returns: boolean
      }
      process_payment_webhook: {
        Args: { p_purchase_id: number; p_webhook_id: number }
        Returns: boolean
      }
      process_player_command: {
        Args: {
          p_command: string
          p_establishment_id?: number
          p_user_id?: number
        }
        Returns: Json
      }
      refresh_establishment_stats: { Args: never; Returns: undefined }
      resolve_tiebreak_stone: {
        Args: { p_card_ids: number[]; p_round_id: number }
        Returns: {
          stone_number: number
          winner_card_id: number
        }[]
      }
      validate_round_time_conflict: {
        Args: {
          p_draw_datetime: string
          p_establishment_id: number
          p_exclude_round_id?: number
        }
        Returns: {
          conflicting_rounds: Json
          has_conflict: boolean
        }[]
      }
      verify_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "establishment" | "user"
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
      app_role: ["admin", "manager", "establishment", "user"],
    },
  },
} as const
