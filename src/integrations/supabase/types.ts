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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          cost: number | null
          created_at: string | null
          error_message: string | null
          generation_type: string
          id: string
          input_prompt: string | null
          model_used: string | null
          output_content: string | null
          processing_time_ms: number | null
          project_id: string | null
          provider: string | null
          status: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          error_message?: string | null
          generation_type: string
          id?: string
          input_prompt?: string | null
          model_used?: string | null
          output_content?: string | null
          processing_time_ms?: number | null
          project_id?: string | null
          provider?: string | null
          status?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          error_message?: string | null
          generation_type?: string
          id?: string
          input_prompt?: string | null
          model_used?: string | null
          output_content?: string | null
          processing_time_ms?: number | null
          project_id?: string | null
          provider?: string | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          category: string
          contact: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          item_name: string
          notes: string | null
          payment_method: string | null
          project_id: string
          quantity: number | null
          status: string | null
          subcategory: string | null
          supplier: string | null
          total_price: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          contact?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          item_name: string
          notes?: string | null
          payment_method?: string | null
          project_id: string
          quantity?: number | null
          status?: string | null
          subcategory?: string | null
          supplier?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          contact?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          payment_method?: string | null
          project_id?: string
          quantity?: number | null
          status?: string | null
          subcategory?: string | null
          supplier?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          actor_name: string | null
          age: string | null
          character_arc: string | null
          costume_notes: string | null
          created_at: string | null
          description: string | null
          gender: string | null
          id: string
          makeup_notes: string | null
          name: string
          project_id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          actor_name?: string | null
          age?: string | null
          character_arc?: string | null
          costume_notes?: string | null
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          makeup_notes?: string | null
          name: string
          project_id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          actor_name?: string | null
          age?: string | null
          character_arc?: string | null
          costume_notes?: string | null
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          makeup_notes?: string | null
          name?: string
          project_id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_content: {
        Row: {
          content: Json
          content_type: string
          created_at: string | null
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          content_type: string
          created_at?: string | null
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string | null
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_content_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          format: string | null
          genre: string | null
          id: string
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scenes: {
        Row: {
          characters: string[] | null
          created_at: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          int_ext: string | null
          location: string | null
          notes: string | null
          order_position: number
          project_id: string
          props: string[] | null
          scene_number: number
          time_of_day: string | null
          updated_at: string | null
        }
        Insert: {
          characters?: string[] | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          int_ext?: string | null
          location?: string | null
          notes?: string | null
          order_position: number
          project_id: string
          props?: string[] | null
          scene_number: number
          time_of_day?: string | null
          updated_at?: string | null
        }
        Update: {
          characters?: string[] | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          int_ext?: string | null
          location?: string | null
          notes?: string | null
          order_position?: number
          project_id?: string
          props?: string[] | null
          scene_number?: number
          time_of_day?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          content: string | null
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
          page_count: number | null
          project_id: string
          source: string | null
          type: string
          updated_at: string | null
          version: number | null
          word_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          page_count?: number | null
          project_id: string
          source?: string | null
          type: string
          updated_at?: string | null
          version?: number | null
          word_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          page_count?: number | null
          project_id?: string
          source?: string | null
          type?: string
          updated_at?: string | null
          version?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      storyboards: {
        Row: {
          camera_angle: string | null
          camera_movement: string | null
          created_at: string | null
          description: string | null
          frame_number: number
          id: string
          image_prompt: string | null
          image_url: string | null
          scene_id: string
        }
        Insert: {
          camera_angle?: string | null
          camera_movement?: string | null
          created_at?: string | null
          description?: string | null
          frame_number: number
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          scene_id: string
        }
        Update: {
          camera_angle?: string | null
          camera_movement?: string | null
          created_at?: string | null
          description?: string | null
          frame_number?: number
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          scene_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storyboards_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_breakdown: {
        Row: {
          created_at: string | null
          equipment: string[] | null
          estimated_setup_time: number | null
          framing: string | null
          id: string
          lens: string | null
          lighting_setup: string | null
          movement: string | null
          notes: string | null
          scene_id: string
          shot_number: string | null
          shot_type: string | null
          sound_notes: string | null
          updated_at: string | null
          vfx_notes: string | null
        }
        Insert: {
          created_at?: string | null
          equipment?: string[] | null
          estimated_setup_time?: number | null
          framing?: string | null
          id?: string
          lens?: string | null
          lighting_setup?: string | null
          movement?: string | null
          notes?: string | null
          scene_id: string
          shot_number?: string | null
          shot_type?: string | null
          sound_notes?: string | null
          updated_at?: string | null
          vfx_notes?: string | null
        }
        Update: {
          created_at?: string | null
          equipment?: string[] | null
          estimated_setup_time?: number | null
          framing?: string | null
          id?: string
          lens?: string | null
          lighting_setup?: string | null
          movement?: string | null
          notes?: string | null
          scene_id?: string
          shot_number?: string | null
          shot_type?: string | null
          sound_notes?: string | null
          updated_at?: string | null
          vfx_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_breakdown_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_usage: {
        Row: {
          ai_generations_limit: number | null
          ai_generations_used: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          next_reset_date: string | null
          plan: string | null
          plan_expires_at: string | null
          plan_started_at: string | null
          projects_count: number | null
          projects_limit: number | null
          storage_limit_mb: number | null
          storage_used_mb: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generations_limit?: number | null
          ai_generations_used?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          next_reset_date?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          projects_count?: number | null
          projects_limit?: number | null
          storage_limit_mb?: number | null
          storage_used_mb?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generations_limit?: number | null
          ai_generations_used?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          next_reset_date?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          projects_count?: number | null
          projects_limit?: number | null
          storage_limit_mb?: number | null
          storage_used_mb?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
