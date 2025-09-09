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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      curriculum_grades: {
        Row: {
          curriculum_code: string
          grade_code: string
          grade_order: number
          id: number
          label_ko: string
        }
        Insert: {
          curriculum_code: string
          grade_code: string
          grade_order: number
          id?: number
          label_ko: string
        }
        Update: {
          curriculum_code?: string
          grade_code?: string
          grade_order?: number
          id?: number
          label_ko?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_grades_curriculum_code_fkey"
            columns: ["curriculum_code"]
            isOneToOne: false
            referencedRelation: "curriculum_systems"
            referencedColumns: ["code"]
          },
        ]
      }
      curriculum_systems: {
        Row: {
          break_end_mm: number
          break_start_mm: number
          code: string | null
          id: number
          name: string
          total_grades: number
          year_start_mm: number
        }
        Insert: {
          break_end_mm: number
          break_start_mm: number
          code?: string | null
          id?: number
          name: string
          total_grades: number
          year_start_mm: number
        }
        Update: {
          break_end_mm?: number
          break_start_mm?: number
          code?: string | null
          id?: number
          name?: string
          total_grades?: number
          year_start_mm?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          difficulty_level: number
          explanation: string | null
          grade_level: string
          id: string
          options: string[] | null
          points: number
          question_text: string
          question_type: string
          subject: string
          system_type: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          difficulty_level?: number
          explanation?: string | null
          grade_level: string
          id?: string
          options?: string[] | null
          points?: number
          question_text: string
          question_type: string
          subject: string
          system_type: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          difficulty_level?: number
          explanation?: string | null
          grade_level?: string
          id?: string
          options?: string[] | null
          points?: number
          question_text?: string
          question_type?: string
          subject?: string
          system_type?: string
        }
        Relationships: []
      }
      reading_answers: {
        Row: {
          answer_status: string | null
          answered_at: string
          id: string
          is_correct: boolean | null
          points_earned: number
          question_id: string
          rubric: Json | null
          score: number | null
          session_id: string
          user_answer: string | null
        }
        Insert: {
          answer_status?: string | null
          answered_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number
          question_id: string
          rubric?: Json | null
          score?: number | null
          session_id: string
          user_answer?: string | null
        }
        Update: {
          answer_status?: string | null
          answered_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number
          question_id?: string
          rubric?: Json | null
          score?: number | null
          session_id?: string
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "reading_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "reading_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_passages: {
        Row: {
          content: string
          created_at: string
          difficulty_level: number
          grade_level: string
          id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          difficulty_level?: number
          grade_level: string
          id?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          difficulty_level?: number
          grade_level?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      reading_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          options: string[] | null
          passage_id: string
          points: number
          question_text: string
          question_type: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          options?: string[] | null
          passage_id: string
          points?: number
          question_text: string
          question_type: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          options?: string[] | null
          passage_id?: string
          points?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_questions_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "reading_passages"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_test_sessions: {
        Row: {
          answered_questions: number
          completed_at: string | null
          id: string
          passage_id: string
          score: number | null
          started_at: string
          status: string
          total_questions: number
          user_id: string
        }
        Insert: {
          answered_questions?: number
          completed_at?: string | null
          id?: string
          passage_id: string
          score?: number | null
          started_at?: string
          status?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          answered_questions?: number
          completed_at?: string | null
          id?: string
          passage_id?: string
          score?: number | null
          started_at?: string
          status?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_test_sessions_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "reading_passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_test_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_test_permissions: {
        Row: {
          allowed_attempts: number | null
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string
          id: string
          is_active: boolean
          test_master_id: string
          test_version_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_attempts?: number | null
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by: string
          id?: string
          is_active?: boolean
          test_master_id: string
          test_version_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_attempts?: number | null
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          id?: string
          is_active?: boolean
          test_master_id?: string
          test_version_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_test_permissions_test_version_fk"
            columns: ["test_version_id"]
            isOneToOne: false
            referencedRelation: "test_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_test_permissions_test_version_fk"
            columns: ["test_version_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_test_permissions_test_version_fk"
            columns: ["test_version_id"]
            isOneToOne: false
            referencedRelation: "user_sessions_view_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_test_permissions_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      test_masters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          time_limit_minutes: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          time_limit_minutes?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          time_limit_minutes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      test_section_questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          options: Json | null
          order_index: number
          points: number
          question_text: string
          question_type: string
          section_id: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question_text: string
          question_type: string
          section_id: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          question_text?: string
          question_type?: string
          section_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_section_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "test_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
          score_weight: number | null
          time_limit_minutes: number | null
          updated_at: string
          version_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number
          score_weight?: number | null
          time_limit_minutes?: number | null
          updated_at?: string
          version_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          score_weight?: number | null
          time_limit_minutes?: number | null
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_sections_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "test_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_sections_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_sections_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "user_sessions_view_backup"
            referencedColumns: ["id"]
          },
        ]
      }
      test_versions: {
        Row: {
          access_mode: string | null
          closes_at: string | null
          created_at: string
          grade_level: string
          id: string
          is_active: boolean
          master_id: string
          max_attempts: number | null
          opens_at: string | null
          release_mode: string | null
          show_breakdown: boolean | null
          system_type: string
          time_limit_minutes: number | null
          updated_at: string
          visibility: string | null
        }
        Insert: {
          access_mode?: string | null
          closes_at?: string | null
          created_at?: string
          grade_level: string
          id?: string
          is_active?: boolean
          master_id: string
          max_attempts?: number | null
          opens_at?: string | null
          release_mode?: string | null
          show_breakdown?: boolean | null
          system_type: string
          time_limit_minutes?: number | null
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          access_mode?: string | null
          closes_at?: string | null
          created_at?: string
          grade_level?: string
          id?: string
          is_active?: boolean
          master_id?: string
          max_attempts?: number | null
          opens_at?: string | null
          release_mode?: string | null
          show_breakdown?: boolean | null
          system_type?: string
          time_limit_minutes?: number | null
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_versions_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "test_masters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          expires_at: string
          issued_at: string
          revoked: boolean
          token: string
          user_id: string
        }
        Insert: {
          expires_at?: string
          issued_at?: string
          revoked?: boolean
          token?: string
          user_id: string
        }
        Update: {
          expires_at?: string
          issued_at?: string
          revoked?: boolean
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions_raw: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          last_accessed: string | null
          released_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          session_token: string
          status: string | null
          total_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          last_accessed?: string | null
          released_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          session_token: string
          status?: string | null
          total_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          last_accessed?: string | null
          released_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          session_token?: string
          status?: string | null
          total_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_reviewed_by_fk"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          date_of_birth: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          grade: string | null
          id: string
          is_active: boolean | null
          password_hash: string
          requires_password_change: boolean
          role: Database["public"]["Enums"]["user_role"]
          school: string | null
          system_type: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          date_of_birth: string
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          grade?: string | null
          id?: string
          is_active?: boolean | null
          password_hash: string
          requires_password_change?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          school?: string | null
          system_type?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          grade?: string | null
          id?: string
          is_active?: boolean | null
          password_hash?: string
          requires_password_change?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          school?: string | null
          system_type?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      tests: {
        Row: {
          access_mode: string | null
          closes_at: string | null
          created_at: string | null
          grade_level: string | null
          id: string | null
          is_active: boolean | null
          master_id: string | null
          max_attempts: number | null
          opens_at: string | null
          release_mode: string | null
          show_breakdown: boolean | null
          system_type: string | null
          time_limit_minutes: number | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          access_mode?: string | null
          closes_at?: string | null
          created_at?: string | null
          grade_level?: string | null
          id?: string | null
          is_active?: boolean | null
          master_id?: string | null
          max_attempts?: number | null
          opens_at?: string | null
          release_mode?: string | null
          show_breakdown?: boolean | null
          system_type?: string | null
          time_limit_minutes?: number | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          access_mode?: string | null
          closes_at?: string | null
          created_at?: string | null
          grade_level?: string | null
          id?: string | null
          is_active?: boolean | null
          master_id?: string | null
          max_attempts?: number | null
          opens_at?: string | null
          release_mode?: string | null
          show_breakdown?: boolean | null
          system_type?: string | null
          time_limit_minutes?: number | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_versions_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "test_masters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions_view_backup: {
        Row: {
          access_mode: string | null
          closes_at: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          opens_at: string | null
          session_token: string | null
          visibility: string | null
        }
        Insert: {
          access_mode?: string | null
          closes_at?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          opens_at?: string | null
          session_token?: never
          visibility?: string | null
        }
        Update: {
          access_mode?: string | null
          closes_at?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          opens_at?: string | null
          session_token?: never
          visibility?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      create_student_self: {
        Args:
          | {
              _date_of_birth: string
              _full_name?: string
              _password: string
              _username: string
            }
          | { _full_name?: string; _password: string; _username: string }
          | {
              p_dob: string
              p_full_name: string
              p_gender: Database["public"]["Enums"]["gender_type"]
              p_grade?: string
              p_password: string
              p_school?: string
              p_username: string
            }
        Returns: {
          id: string
          role: string
          username: string
        }[]
      }
      email_for_username: {
        Args: { p_username: string }
        Returns: string
      }
      get_my_profile: {
        Args: { _session_token: string }
        Returns: {
          full_name: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
          username: string
        }[]
      }
      is_staff: {
        Args: { uid: string }
        Returns: boolean
      }
      reset_password_as_staff: {
        Args: {
          _new_password: string
          _session_token: string
          _target_username: string
        }
        Returns: boolean
      }
      set_request_header: {
        Args: { key: string; value: string }
        Returns: undefined
      }
      supa_diag: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_user_login: {
        Args: { p_password: string; p_username: string }
        Returns: {
          full_name: string
          role: Database["public"]["Enums"]["user_role"]
          token: string
          user_id: string
        }[]
      }
    }
    Enums: {
      gender_type: "male" | "female" | "other"
      user_role: "student" | "teacher" | "admin"
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
      gender_type: ["male", "female", "other"],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const
