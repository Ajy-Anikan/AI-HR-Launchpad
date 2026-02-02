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
      answer_evaluations: {
        Row: {
          answer_id: string
          clarity_rating: string
          depth_rating: string
          evaluated_at: string
          feedback_text: string
          id: string
          relevance_rating: string
        }
        Insert: {
          answer_id: string
          clarity_rating: string
          depth_rating: string
          evaluated_at?: string
          feedback_text: string
          id?: string
          relevance_rating: string
        }
        Update: {
          answer_id?: string
          clarity_rating?: string
          depth_rating?: string
          evaluated_at?: string
          feedback_text?: string
          id?: string
          relevance_rating?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_evaluations_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: true
            referencedRelation: "mock_interview_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      company_practice_answers: {
        Row: {
          answer_text: string | null
          answered_at: string | null
          created_at: string
          id: string
          question_number: number
          question_text: string
          session_id: string
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          question_number: number
          question_text: string
          session_id: string
        }
        Update: {
          answer_text?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          question_number?: number
          question_text?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_practice_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "company_practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_practice_sessions: {
        Row: {
          company: string
          completed_at: string | null
          difficulty: string
          id: string
          practice_year: number | null
          question_type: string
          started_at: string
          status: string
          total_questions: number
          user_id: string
        }
        Insert: {
          company: string
          completed_at?: string | null
          difficulty: string
          id?: string
          practice_year?: number | null
          question_type: string
          started_at?: string
          status?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          company?: string
          completed_at?: string | null
          difficulty?: string
          id?: string
          practice_year?: number | null
          question_type?: string
          started_at?: string
          status?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      job_requirements: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          min_experience_years: number | null
          required_skills: string[]
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_experience_years?: number | null
          required_skills: string[]
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_experience_years?: number | null
          required_skills?: string[]
          title?: string
        }
        Relationships: []
      }
      mock_interview_answers: {
        Row: {
          answer_text: string | null
          answered_at: string | null
          created_at: string
          id: string
          question_number: number
          question_text: string
          session_id: string
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          question_number: number
          question_text: string
          session_id: string
        }
        Update: {
          answer_text?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          question_number?: number
          question_text?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mock_interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_sessions: {
        Row: {
          completed_at: string | null
          id: string
          interview_type: string
          role_level: string
          started_at: string
          status: string
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          interview_type: string
          role_level: string
          started_at?: string
          status?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          interview_type?: string
          role_level?: string
          started_at?: string
          status?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          content_type: string
          education: string | null
          experience_years: number | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          parsed_data: Json | null
          skills: string[] | null
          summary: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          content_type: string
          education?: string | null
          experience_years?: number | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          parsed_data?: Json | null
          skills?: string[] | null
          summary?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          education?: string | null
          experience_years?: number | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          parsed_data?: Json | null
          skills?: string[] | null
          summary?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      screening_results: {
        Row: {
          analysis: string | null
          id: string
          job_id: string
          match_score: number
          matched_skills: string[] | null
          missing_skills: string[] | null
          resume_id: string
          screened_at: string
        }
        Insert: {
          analysis?: string | null
          id?: string
          job_id: string
          match_score: number
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          resume_id: string
          screened_at?: string
        }
        Update: {
          analysis?: string | null
          id?: string
          job_id?: string
          match_score?: number
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          resume_id?: string
          screened_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_results_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      session_evaluations: {
        Row: {
          evaluated_at: string
          gaps: string[]
          id: string
          improvement_tips: string[]
          session_id: string
          strengths: string[]
          summary_message: string
        }
        Insert: {
          evaluated_at?: string
          gaps?: string[]
          id?: string
          improvement_tips?: string[]
          session_id: string
          strengths?: string[]
          summary_message: string
        }
        Update: {
          evaluated_at?: string
          gaps?: string[]
          id?: string
          improvement_tips?: string[]
          session_id?: string
          strengths?: string[]
          summary_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "mock_interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_progress: {
        Row: {
          communication_score: number
          consistency_score: number | null
          id: string
          notes: string | null
          overall_progress_score: number
          recorded_at: string
          source: string
          technical_score: number
          user_id: string
        }
        Insert: {
          communication_score: number
          consistency_score?: number | null
          id?: string
          notes?: string | null
          overall_progress_score: number
          recorded_at?: string
          source?: string
          technical_score: number
          user_id: string
        }
        Update: {
          communication_score?: number
          consistency_score?: number | null
          id?: string
          notes?: string | null
          overall_progress_score?: number
          recorded_at?: string
          source?: string
          technical_score?: number
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "candidate" | "hr"
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
      app_role: ["candidate", "hr"],
    },
  },
} as const
