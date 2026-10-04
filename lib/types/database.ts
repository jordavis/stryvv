
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "check_ins": {
                  Row: {
                    "completed_at": string,"id": string,"kind": Database["public"]['Enums']["check_in_kind"],"owner_id": string,"source_conversation_id": string | null
                  }
                  Insert: {
                    "completed_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["check_in_kind"],"owner_id"?: string,"source_conversation_id"?: string | null
                  }
                  Update: {
                    "completed_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["check_in_kind"],"owner_id"?: string,"source_conversation_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "check_ins_source_conversation_id_fkey"
      columns: ["source_conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "created_at": string,"id": string,"kind": Database["public"]['Enums']["conversation_kind"],"owner_id": string,"topic": string | null,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["conversation_kind"],"owner_id"?: string,"topic"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["conversation_kind"],"owner_id"?: string,"topic"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"goals": {
                  Row: {
                    "confirmed_at": string,"created_at": string,"current_amount": number,"id": string,"owner_id": string,"partnership_id": string | null,"source_conversation_id": string | null,"status": Database["public"]['Enums']["goal_status"],"target_amount": number | null,"target_date": string | null,"title": string,"updated_at": string,"why": string | null
                  }
                  Insert: {
                    "confirmed_at"?: string,"created_at"?: string,"current_amount"?: number,"id"?: string,"owner_id"?: string,"partnership_id"?: string | null,"source_conversation_id"?: string | null,"status"?: Database["public"]['Enums']["goal_status"],"target_amount"?: number | null,"target_date"?: string | null,"title": string,"updated_at"?: string,"why"?: string | null
                  }
                  Update: {
                    "confirmed_at"?: string,"created_at"?: string,"current_amount"?: number,"id"?: string,"owner_id"?: string,"partnership_id"?: string | null,"source_conversation_id"?: string | null,"status"?: Database["public"]['Enums']["goal_status"],"target_amount"?: number | null,"target_date"?: string | null,"title"?: string,"updated_at"?: string,"why"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "goals_partnership_id_fkey"
      columns: ["partnership_id"]
isOneToOne: false
      referencedRelation: "partnerships"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "goals_source_conversation_id_fkey"
      columns: ["source_conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"measurements": {
                  Row: {
                    "check_in_id": string,"id": string,"metric": string,"owner_id": string,"recorded_at": string,"value": number
                  }
                  Insert: {
                    "check_in_id": string,"id"?: string,"metric": string,"owner_id"?: string,"recorded_at"?: string,"value": number
                  }
                  Update: {
                    "check_in_id"?: string,"id"?: string,"metric"?: string,"owner_id"?: string,"recorded_at"?: string,"value"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "measurements_check_in_id_fkey"
      columns: ["check_in_id"]
isOneToOne: false
      referencedRelation: "check_ins"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "content": string,"conversation_id": string,"created_at": string,"id": string,"owner_id": string,"role": Database["public"]['Enums']["message_role"]
                  }
                  Insert: {
                    "content": string,"conversation_id": string,"created_at"?: string,"id"?: string,"owner_id"?: string,"role": Database["public"]['Enums']["message_role"]
                  }
                  Update: {
                    "content"?: string,"conversation_id"?: string,"created_at"?: string,"id"?: string,"owner_id"?: string,"role"?: Database["public"]['Enums']["message_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"money_dates": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"held_at": string,"id": string,"logged_by": string,"notes": string | null,"partnership_id": string,"updated_at": string
                  }
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"held_at"?: string,"id"?: string,"logged_by"?: string,"notes"?: string | null,"partnership_id": string,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"held_at"?: string,"id"?: string,"logged_by"?: string,"notes"?: string | null,"partnership_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "money_dates_partnership_id_fkey"
      columns: ["partnership_id"]
isOneToOne: false
      referencedRelation: "partnerships"
      referencedColumns: ["id"]
    }
                  ]
                },"money_history_entries": {
                  Row: {
                    "archived_at": string | null,"attributes": NonNullable<Json>,"confirmed_at": string,"created_at": string,"description": string | null,"id": string,"kind": Database["public"]['Enums']["money_history_kind"],"owner_id": string,"source_conversation_id": string | null,"title": string,"updated_at": string
                  }
                  Insert: {
                    "archived_at"?: string | null,"attributes"?: NonNullable<Json>,"confirmed_at"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["money_history_kind"],"owner_id"?: string,"source_conversation_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"attributes"?: NonNullable<Json>,"confirmed_at"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["money_history_kind"],"owner_id"?: string,"source_conversation_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "money_history_entries_source_conversation_id_fkey"
      columns: ["source_conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"money_move_logs": {
                  Row: {
                    "created_at": string,"done_count": number,"id": string,"money_move_id": string,"owner_id": string,"updated_at": string,"week_start": string
                  }
                  Insert: {
                    "created_at"?: string,"done_count"?: number,"id"?: string,"money_move_id": string,"owner_id"?: string,"updated_at"?: string,"week_start": string
                  }
                  Update: {
                    "created_at"?: string,"done_count"?: number,"id"?: string,"money_move_id"?: string,"owner_id"?: string,"updated_at"?: string,"week_start"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "money_move_logs_money_move_id_fkey"
      columns: ["money_move_id"]
isOneToOne: false
      referencedRelation: "money_moves"
      referencedColumns: ["id"]
    }
                  ]
                },"money_moves": {
                  Row: {
                    "confirmed_at": string,"created_at": string,"goal_id": string | null,"id": string,"owner_id": string,"partnership_id": string | null,"source_conversation_id": string | null,"status": Database["public"]['Enums']["money_move_status"],"times_per_week": number,"title": string,"updated_at": string,"why": string | null
                  }
                  Insert: {
                    "confirmed_at"?: string,"created_at"?: string,"goal_id"?: string | null,"id"?: string,"owner_id"?: string,"partnership_id"?: string | null,"source_conversation_id"?: string | null,"status"?: Database["public"]['Enums']["money_move_status"],"times_per_week"?: number,"title": string,"updated_at"?: string,"why"?: string | null
                  }
                  Update: {
                    "confirmed_at"?: string,"created_at"?: string,"goal_id"?: string | null,"id"?: string,"owner_id"?: string,"partnership_id"?: string | null,"source_conversation_id"?: string | null,"status"?: Database["public"]['Enums']["money_move_status"],"times_per_week"?: number,"title"?: string,"updated_at"?: string,"why"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "money_moves_goal_id_fkey"
      columns: ["goal_id"]
isOneToOne: false
      referencedRelation: "goals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "money_moves_partnership_id_fkey"
      columns: ["partnership_id"]
isOneToOne: false
      referencedRelation: "partnerships"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "money_moves_source_conversation_id_fkey"
      columns: ["source_conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"partnerships": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"ended_at": string | null,"ended_by": string | null,"id": string,"invite_code": string,"invite_expires_at": string,"invitee_id": string | null,"inviter_id": string,"status": Database["public"]['Enums']["partnership_status"]
                  }
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"ended_at"?: string | null,"ended_by"?: string | null,"id"?: string,"invite_code": string,"invite_expires_at": string,"invitee_id"?: string | null,"inviter_id": string,"status"?: Database["public"]['Enums']["partnership_status"]
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"ended_at"?: string | null,"ended_by"?: string | null,"id"?: string,"invite_code"?: string,"invite_expires_at"?: string,"invitee_id"?: string | null,"inviter_id"?: string,"status"?: Database["public"]['Enums']["partnership_status"]
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"first_name": string,"id": string,"last_name": string,"onboarding_stage": string,"phone": string | null,"terms_accepted_at": string | null,"terms_version": string | null,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"first_name"?: string,"id": string,"last_name"?: string,"onboarding_stage"?: string,"phone"?: string | null,"terms_accepted_at"?: string | null,"terms_version"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"first_name"?: string,"id"?: string,"last_name"?: string,"onboarding_stage"?: string,"phone"?: string | null,"terms_accepted_at"?: string | null,"terms_version"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"sharing_settings": {
                  Row: {
                    "category": Database["public"]['Enums']["sharing_category"],"owner_id": string,"partnership_id": string,"shared": boolean,"updated_at": string
                  }
                  Insert: {
                    "category": Database["public"]['Enums']["sharing_category"],"owner_id": string,"partnership_id": string,"shared"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["sharing_category"],"owner_id"?: string,"partnership_id"?: string,"shared"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sharing_settings_partnership_id_fkey"
      columns: ["partnership_id"]
isOneToOne: false
      referencedRelation: "partnerships"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invite":
{ Args: { "_code": string }; Returns: string
                           },
"can_view":
{ Args: { "_category": Database["public"]['Enums']["sharing_category"],"_owner_id": string }; Returns: boolean
                           },
"create_invite":
{ Args: Record<PropertyKey, never>; Returns: {
              "code": string,"expires_at": string
            }[]
                           },
"end_partnership":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"get_partner":
{ Args: Record<PropertyKey, never>; Returns: {
              "first_name": string,"id": string
            }[]
                           },
"is_active_partnership_member":
{ Args: { "_partnership_id": string }; Returns: boolean
                           },
"is_partnership_member":
{ Args: { "_partnership_id": string }; Returns: boolean
                           },
"preview_invite":
{ Args: { "_code": string }; Returns: {
              "inviter_first_name": string,"valid": boolean
            }[]
                           }
          }
          Enums: {
            "check_in_kind": "baseline"|"weekly"|"monthly"|"quarterly","conversation_kind": "onboarding"|"coach"|"check_in","goal_status": "active"|"reached"|"archived","message_role": "user"|"assistant","money_history_kind": "memory"|"belief"|"pattern"|"win","money_move_status": "active"|"paused"|"archived","partnership_status": "pending"|"active"|"ended","sharing_category": "money_history"|"goals"|"money_moves"|"scores"|"money_data"|"documents"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "check_in_kind": ["baseline", "weekly", "monthly", "quarterly"],"conversation_kind": ["onboarding", "coach", "check_in"],"goal_status": ["active", "reached", "archived"],"message_role": ["user", "assistant"],"money_history_kind": ["memory", "belief", "pattern", "win"],"money_move_status": ["active", "paused", "archived"],"partnership_status": ["pending", "active", "ended"],"sharing_category": ["money_history", "goals", "money_moves", "scores", "money_data", "documents"]
          }
        }
} as const
