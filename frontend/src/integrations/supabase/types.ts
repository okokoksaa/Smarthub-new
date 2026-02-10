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
      ai_advisories: {
        Row: {
          advisory_type: string
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          is_resolved: boolean
          recommendations: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number | null
          title: string
        }
        Insert: {
          advisory_type: string
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_resolved?: boolean
          recommendations?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score?: number | null
          title: string
        }
        Update: {
          advisory_type?: string
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_resolved?: boolean
          recommendations?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_score?: number | null
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          constituency_id: string | null
          created_at: string
          data_after: Json | null
          data_before: Json | null
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          ward_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          constituency_id?: string | null
          created_at?: string
          data_after?: Json | null
          data_before?: Json | null
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          ward_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          constituency_id?: string | null
          created_at?: string
          data_after?: Json | null
          data_before?: Json | null
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "audit_logs_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          admin_allocation: number
          approved_at: string | null
          approved_by: string | null
          bursaries_allocation: number
          constituency_id: string
          created_at: string
          disbursed_amount: number
          empowerment_allocation: number
          fiscal_year: number
          id: string
          is_approved: boolean
          projects_allocation: number
          total_allocation: number
          updated_at: string
          ward_id: string | null
        }
        Insert: {
          admin_allocation?: number
          approved_at?: string | null
          approved_by?: string | null
          bursaries_allocation?: number
          constituency_id: string
          created_at?: string
          disbursed_amount?: number
          empowerment_allocation?: number
          fiscal_year: number
          id?: string
          is_approved?: boolean
          projects_allocation?: number
          total_allocation?: number
          updated_at?: string
          ward_id?: string | null
        }
        Update: {
          admin_allocation?: number
          approved_at?: string | null
          approved_by?: string | null
          bursaries_allocation?: number
          constituency_id?: string
          created_at?: string
          disbursed_amount?: number
          empowerment_allocation?: number
          fiscal_year?: number
          id?: string
          is_approved?: boolean
          projects_allocation?: number
          total_allocation?: number
          updated_at?: string
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "budgets_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      bursary_applications: {
        Row: {
          academic_year: number
          accommodation_fees: number | null
          application_number: string
          approved_amount: number | null
          approved_at: string | null
          approved_by: string | null
          book_allowance: number | null
          constituency_id: string
          created_at: string
          disbursed_at: string | null
          guardian_name: string | null
          guardian_nrc: string | null
          guardian_phone: string | null
          id: string
          institution_name: string
          institution_type: string
          program_of_study: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["bursary_status"]
          student_name: string
          student_nrc: string | null
          student_phone: string | null
          submitted_at: string
          total_requested: number
          tuition_fees: number
          updated_at: string
          ward_id: string | null
          year_of_study: number | null
        }
        Insert: {
          academic_year: number
          accommodation_fees?: number | null
          application_number: string
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          book_allowance?: number | null
          constituency_id: string
          created_at?: string
          disbursed_at?: string | null
          guardian_name?: string | null
          guardian_nrc?: string | null
          guardian_phone?: string | null
          id?: string
          institution_name: string
          institution_type: string
          program_of_study?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["bursary_status"]
          student_name: string
          student_nrc?: string | null
          student_phone?: string | null
          submitted_at?: string
          total_requested?: number
          tuition_fees?: number
          updated_at?: string
          ward_id?: string | null
          year_of_study?: number | null
        }
        Update: {
          academic_year?: number
          accommodation_fees?: number | null
          application_number?: string
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          book_allowance?: number | null
          constituency_id?: string
          created_at?: string
          disbursed_at?: string | null
          guardian_name?: string | null
          guardian_nrc?: string | null
          guardian_phone?: string | null
          id?: string
          institution_name?: string
          institution_type?: string
          program_of_study?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["bursary_status"]
          student_name?: string
          student_nrc?: string | null
          student_phone?: string | null
          submitted_at?: string
          total_requested?: number
          tuition_fees?: number
          updated_at?: string
          ward_id?: string | null
          year_of_study?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bursary_applications_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "bursary_applications_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bursary_applications_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_members: {
        Row: {
          committee_id: string
          id: string
          is_active: boolean
          joined_at: string
          left_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          committee_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          committee_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_members_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          chair_id: string | null
          committee_type: string
          constituency_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          province_id: string | null
          quorum_required: number
          secretary_id: string | null
          updated_at: string
        }
        Insert: {
          chair_id?: string | null
          committee_type: string
          constituency_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          province_id?: string | null
          quorum_required?: number
          secretary_id?: string | null
          updated_at?: string
        }
        Update: {
          chair_id?: string | null
          committee_type?: string
          constituency_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          province_id?: string | null
          quorum_required?: number
          secretary_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "committees_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "committees_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committees_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      constituencies: {
        Row: {
          allocated_budget: number
          code: string
          created_at: string
          disbursed_budget: number
          district_id: string
          id: string
          name: string
          total_budget: number
          updated_at: string
        }
        Insert: {
          allocated_budget?: number
          code: string
          created_at?: string
          disbursed_budget?: number
          district_id: string
          id?: string
          name: string
          total_budget?: number
          updated_at?: string
        }
        Update: {
          allocated_budget?: number
          code?: string
          created_at?: string
          disbursed_budget?: number
          district_id?: string
          id?: string
          name?: string
          total_budget?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "constituencies_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          phone: string | null
          registration_number: string | null
          tax_clearance_expiry: string | null
          tax_clearance_valid: boolean
          updated_at: string
          user_id: string | null
          zppa_category: string | null
          zppa_registration: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          registration_number?: string | null
          tax_clearance_expiry?: string | null
          tax_clearance_valid?: boolean
          updated_at?: string
          user_id?: string | null
          zppa_category?: string | null
          zppa_registration?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          registration_number?: string | null
          tax_clearance_expiry?: string | null
          tax_clearance_valid?: boolean
          updated_at?: string
          user_id?: string | null
          zppa_category?: string | null
          zppa_registration?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          province_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          province_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          province_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          constituency_id: string
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_hash: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          immutable_at: string | null
          immutable_by: string | null
          is_immutable: boolean
          metadata: Json | null
          mime_type: string | null
          project_id: string | null
          updated_at: string
          uploader_id: string | null
          ward_id: string | null
        }
        Insert: {
          constituency_id: string
          created_at?: string
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_hash: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          immutable_at?: string | null
          immutable_by?: string | null
          is_immutable?: boolean
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string | null
          updated_at?: string
          uploader_id?: string | null
          ward_id?: string | null
        }
        Update: {
          constituency_id?: string
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_hash?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          immutable_at?: string | null
          immutable_by?: string | null
          is_immutable?: boolean
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string | null
          updated_at?: string
          uploader_id?: string | null
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "documents_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_immutable_by_fkey"
            columns: ["immutable_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      empowerment_grants: {
        Row: {
          applicant_address: string | null
          applicant_name: string
          applicant_nrc: string | null
          applicant_phone: string | null
          approved_amount: number | null
          approved_at: string | null
          approved_by: string | null
          completion_report: string | null
          constituency_id: string
          created_at: string
          disbursed_at: string | null
          grant_number: string
          grant_type: string
          group_name: string | null
          group_size: number | null
          id: string
          purpose: string
          requested_amount: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["grant_status"]
          submitted_at: string
          updated_at: string
          ward_id: string | null
        }
        Insert: {
          applicant_address?: string | null
          applicant_name: string
          applicant_nrc?: string | null
          applicant_phone?: string | null
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          completion_report?: string | null
          constituency_id: string
          created_at?: string
          disbursed_at?: string | null
          grant_number: string
          grant_type: string
          group_name?: string | null
          group_size?: number | null
          id?: string
          purpose: string
          requested_amount: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["grant_status"]
          submitted_at?: string
          updated_at?: string
          ward_id?: string | null
        }
        Update: {
          applicant_address?: string | null
          applicant_name?: string
          applicant_nrc?: string | null
          applicant_phone?: string | null
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          completion_report?: string | null
          constituency_id?: string
          created_at?: string
          disbursed_at?: string | null
          grant_number?: string
          grant_type?: string
          group_name?: string | null
          group_size?: number | null
          id?: string
          purpose?: string
          requested_amount?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["grant_status"]
          submitted_at?: string
          updated_at?: string
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empowerment_grants_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "empowerment_grants_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empowerment_grants_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      expenditure_returns: {
        Row: {
          admin_spent: number
          balance: number
          bursaries_spent: number
          constituency_id: string
          created_at: string
          empowerment_spent: number
          fiscal_year: number
          id: string
          period_end: string
          period_start: string
          projects_spent: number
          quarter: number
          return_number: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["return_status"]
          submitted_at: string | null
          submitted_by: string | null
          total_received: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          admin_spent?: number
          balance?: number
          bursaries_spent?: number
          constituency_id: string
          created_at?: string
          empowerment_spent?: number
          fiscal_year: number
          id?: string
          period_end: string
          period_start: string
          projects_spent?: number
          quarter: number
          return_number: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          total_received?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          admin_spent?: number
          balance?: number
          bursaries_spent?: number
          constituency_id?: string
          created_at?: string
          empowerment_spent?: number
          fiscal_year?: number
          id?: string
          period_end?: string
          period_start?: string
          projects_spent?: number
          quarter?: number
          return_number?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          total_received?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenditure_returns_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "expenditure_returns_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          attendance_time: string | null
          attended: boolean
          id: string
          meeting_id: string
          signature: string | null
          user_id: string
        }
        Insert: {
          attendance_time?: string | null
          attended?: boolean
          id?: string
          meeting_id: string
          signature?: string | null
          user_id: string
        }
        Update: {
          attendance_time?: string | null
          attended?: boolean
          id?: string
          meeting_id?: string
          signature?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: Json | null
          committee_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          meeting_date: string
          minutes: string | null
          minutes_approved: boolean
          minutes_approved_at: string | null
          quorum_present: number | null
          start_time: string | null
          status: string
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          agenda?: Json | null
          committee_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          meeting_date: string
          minutes?: string | null
          minutes_approved?: boolean
          minutes_approved_at?: string | null
          quorum_present?: number | null
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          agenda?: Json | null
          committee_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          meeting_date?: string
          minutes?: string | null
          minutes_approved?: boolean
          minutes_approved_at?: string | null
          quorum_present?: number | null
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          ai_flags: Json | null
          ai_risk_level: Database["public"]["Enums"]["risk_level"] | null
          ai_risk_score: number | null
          amount: number
          beneficiary_account: string | null
          beneficiary_bank: string | null
          beneficiary_name: string
          created_at: string
          created_by: string | null
          description: string | null
          document_id: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          milestone: string | null
          panel_a_approved_at: string | null
          panel_a_approved_by: string | null
          panel_b_approved_at: string | null
          panel_b_approved_by: string | null
          payment_number: string
          project_id: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          ai_flags?: Json | null
          ai_risk_level?: Database["public"]["Enums"]["risk_level"] | null
          ai_risk_score?: number | null
          amount: number
          beneficiary_account?: string | null
          beneficiary_bank?: string | null
          beneficiary_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_id?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          milestone?: string | null
          panel_a_approved_at?: string | null
          panel_a_approved_by?: string | null
          panel_b_approved_at?: string | null
          panel_b_approved_by?: string | null
          payment_number: string
          project_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          ai_flags?: Json | null
          ai_risk_level?: Database["public"]["Enums"]["risk_level"] | null
          ai_risk_score?: number | null
          amount?: number
          beneficiary_account?: string | null
          beneficiary_bank?: string | null
          beneficiary_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_id?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          milestone?: string | null
          panel_a_approved_at?: string | null
          panel_a_approved_by?: string | null
          panel_b_approved_at?: string | null
          panel_b_approved_by?: string | null
          payment_number?: string
          project_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      procurements: {
        Row: {
          award_date: string | null
          awarded_contractor_id: string | null
          bid_opening_date: string | null
          closing_date: string | null
          constituency_id: string
          contract_value: number | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_value: number
          id: string
          procurement_method: string
          procurement_number: string
          project_id: string | null
          publish_date: string | null
          status: Database["public"]["Enums"]["procurement_status"]
          title: string
          updated_at: string
          zppa_reference: string | null
        }
        Insert: {
          award_date?: string | null
          awarded_contractor_id?: string | null
          bid_opening_date?: string | null
          closing_date?: string | null
          constituency_id: string
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_value?: number
          id?: string
          procurement_method?: string
          procurement_number: string
          project_id?: string | null
          publish_date?: string | null
          status?: Database["public"]["Enums"]["procurement_status"]
          title: string
          updated_at?: string
          zppa_reference?: string | null
        }
        Update: {
          award_date?: string | null
          awarded_contractor_id?: string | null
          bid_opening_date?: string | null
          closing_date?: string | null
          constituency_id?: string
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_value?: number
          id?: string
          procurement_method?: string
          procurement_number?: string
          project_id?: string | null
          publish_date?: string | null
          status?: Database["public"]["Enums"]["procurement_status"]
          title?: string
          updated_at?: string
          zppa_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procurements_awarded_contractor_id_fkey"
            columns: ["awarded_contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurements_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "procurements_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurements_project_id_fkey"
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
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_end_date: string | null
          ai_risk_factors: Json | null
          ai_risk_level: Database["public"]["Enums"]["risk_level"] | null
          ai_risk_score: number | null
          approved_at: string | null
          approved_by: string | null
          beneficiaries: number | null
          budget: number
          constituency_id: string
          contractor_id: string | null
          created_at: string
          description: string | null
          expected_end_date: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          location_description: string | null
          name: string
          progress: number
          project_number: string
          sector: Database["public"]["Enums"]["project_sector"]
          spent: number
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
          ward_id: string | null
        }
        Insert: {
          actual_end_date?: string | null
          ai_risk_factors?: Json | null
          ai_risk_level?: Database["public"]["Enums"]["risk_level"] | null
          ai_risk_score?: number | null
          approved_at?: string | null
          approved_by?: string | null
          beneficiaries?: number | null
          budget: number
          constituency_id: string
          contractor_id?: string | null
          created_at?: string
          description?: string | null
          expected_end_date?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          location_description?: string | null
          name: string
          progress?: number
          project_number: string
          sector: Database["public"]["Enums"]["project_sector"]
          spent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          ward_id?: string | null
        }
        Update: {
          actual_end_date?: string | null
          ai_risk_factors?: Json | null
          ai_risk_level?: Database["public"]["Enums"]["risk_level"] | null
          ai_risk_score?: number | null
          approved_at?: string | null
          approved_by?: string | null
          beneficiaries?: number | null
          budget?: number
          constituency_id?: string
          contractor_id?: string | null
          created_at?: string
          description?: string | null
          expected_end_date?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          location_description?: string | null
          name?: string
          progress?: number
          project_number?: string
          sector?: Database["public"]["Enums"]["project_sector"]
          spent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "projects_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contractor_fk"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      provinces: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          ip_address: unknown
          is_resolved: boolean
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          ip_address?: unknown
          is_resolved?: boolean
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          is_resolved?: boolean
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_integrations: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          endpoint_url: string | null
          id: string
          integration_type: string
          is_enabled: boolean
          last_error: string | null
          last_sync_at: string | null
          name: string
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          endpoint_url?: string | null
          id?: string
          integration_type: string
          is_enabled?: boolean
          last_error?: string | null
          last_sync_at?: string | null
          name: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          endpoint_url?: string | null
          id?: string
          integration_type?: string
          is_enabled?: boolean
          last_error?: string | null
          last_sync_at?: string | null
          name?: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string
          unit: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string
          unit?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string
          unit?: string | null
        }
        Relationships: []
      }
      user_assignments: {
        Row: {
          constituency_id: string | null
          created_at: string
          district_id: string | null
          id: string
          is_primary: boolean
          province_id: string | null
          user_id: string
          ward_id: string | null
        }
        Insert: {
          constituency_id?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          is_primary?: boolean
          province_id?: string | null
          user_id: string
          ward_id?: string | null
        }
        Update: {
          constituency_id?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          is_primary?: boolean
          province_id?: string | null
          user_id?: string
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_assignments_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "user_assignments_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_assignments_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_assignments_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_assignments_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
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
      wards: {
        Row: {
          code: string
          constituency_id: string
          created_at: string
          id: string
          name: string
          population: number | null
        }
        Insert: {
          code: string
          constituency_id: string
          created_at?: string
          id?: string
          name: string
          population?: number | null
        }
        Update: {
          code?: string
          constituency_id?: string
          created_at?: string
          id?: string
          name?: string
          population?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wards_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "analytics_constituency_performance"
            referencedColumns: ["constituency_id"]
          },
          {
            foreignKeyName: "wards_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
        ]
      }
      wdc_signoffs: {
        Row: {
          attendees_count: number
          chair_name: string
          chair_nrc: string | null
          chair_signature: string | null
          chair_signed: boolean
          chair_signed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          meeting_date: string
          meeting_id: string | null
          meeting_minutes_url: string | null
          non_residents_count: number | null
          notes: string | null
          project_id: string
          quorum_met: boolean
          residency_notes: string | null
          residency_threshold_met: boolean
          residency_verification_method: string | null
          residency_verified: boolean
          residency_verified_by: string | null
          residents_count: number | null
          updated_at: string
          ward_id: string | null
        }
        Insert: {
          attendees_count?: number
          chair_name: string
          chair_nrc?: string | null
          chair_signature?: string | null
          chair_signed?: boolean
          chair_signed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_date: string
          meeting_id?: string | null
          meeting_minutes_url?: string | null
          non_residents_count?: number | null
          notes?: string | null
          project_id: string
          quorum_met?: boolean
          residency_notes?: string | null
          residency_threshold_met?: boolean
          residency_verification_method?: string | null
          residency_verified?: boolean
          residency_verified_by?: string | null
          residents_count?: number | null
          updated_at?: string
          ward_id?: string | null
        }
        Update: {
          attendees_count?: number
          chair_name?: string
          chair_nrc?: string | null
          chair_signature?: string | null
          chair_signed?: boolean
          chair_signed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_date?: string
          meeting_id?: string | null
          meeting_minutes_url?: string | null
          non_residents_count?: number | null
          notes?: string | null
          project_id?: string
          quorum_met?: boolean
          residency_notes?: string | null
          residency_threshold_met?: boolean
          residency_verification_method?: string | null
          residency_verified?: boolean
          residency_verified_by?: string | null
          residents_count?: number | null
          updated_at?: string
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wdc_signoffs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wdc_signoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wdc_signoffs_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_constituency_performance: {
        Row: {
          absorption_rate: number | null
          active_projects: number | null
          completed_projects: number | null
          constituency_code: string | null
          constituency_id: string | null
          constituency_name: string | null
          critical_alerts: number | null
          district_name: string | null
          last_updated: string | null
          pending_payments: number | null
          province_name: string | null
          risk_index: number | null
          total_budget_allocated: number | null
          total_funds_disbursed: number | null
          total_projects: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_constituency: {
        Args: { _constituency_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_constituencies: { Args: { _user_id: string }; Returns: string[] }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      make_document_immutable: { Args: { doc_id: string }; Returns: boolean }
      submit_payment_request: {
        Args: {
          p_amount: number
          p_beneficiary_name?: string
          p_description?: string
          p_document_id?: string
          p_milestone?: string
          p_project_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["payment_submission_result"]
        SetofOptions: {
          from: "*"
          to: "payment_submission_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_document_public: {
        Args: { doc_id: string }
        Returns: Database["public"]["CompositeTypes"]["document_verification_result"]
        SetofOptions: {
          from: "*"
          to: "document_verification_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "ministry_official"
        | "auditor"
        | "plgo"
        | "tac_chair"
        | "tac_member"
        | "cdfc_chair"
        | "cdfc_member"
        | "finance_officer"
        | "wdc_member"
        | "mp"
        | "contractor"
        | "citizen"
      bursary_status:
        | "submitted"
        | "shortlisted"
        | "approved"
        | "disbursed"
        | "rejected"
        | "withdrawn"
      document_type:
        | "application"
        | "invoice"
        | "meeting_minutes"
        | "approval_letter"
        | "site_photo"
        | "wdc_signoff"
        | "procurement_bid"
        | "contract"
        | "completion_certificate"
        | "other"
      grant_status:
        | "submitted"
        | "under_review"
        | "approved"
        | "disbursed"
        | "completed"
        | "rejected"
      integration_status: "active" | "inactive" | "error" | "pending"
      payment_status:
        | "draft"
        | "submitted"
        | "finance_review"
        | "panel_a_pending"
        | "panel_b_pending"
        | "approved"
        | "executed"
        | "rejected"
        | "cancelled"
      procurement_status:
        | "draft"
        | "published"
        | "bid_opening"
        | "evaluation"
        | "awarded"
        | "contracted"
        | "completed"
        | "cancelled"
      project_sector:
        | "education"
        | "health"
        | "water"
        | "roads"
        | "agriculture"
        | "community"
        | "energy"
        | "governance"
        | "other"
      project_status:
        | "draft"
        | "submitted"
        | "cdfc_review"
        | "tac_appraisal"
        | "plgo_review"
        | "approved"
        | "implementation"
        | "completed"
        | "rejected"
        | "cancelled"
      return_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "revision_required"
      risk_level: "low" | "medium" | "high" | "critical"
    }
    CompositeTypes: {
      document_verification_result: {
        valid: boolean | null
        document_type: string | null
        file_hash: string | null
        upload_timestamp: string | null
        project_id: string | null
        project_name: string | null
        project_status: string | null
        uploader_role: string | null
        is_immutable: boolean | null
      }
      payment_submission_result: {
        success: boolean | null
        payment_id: string | null
        payment_number: string | null
        risk_score: number | null
        risk_level: string | null
        error_message: string | null
      }
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
      app_role: [
        "super_admin",
        "ministry_official",
        "auditor",
        "plgo",
        "tac_chair",
        "tac_member",
        "cdfc_chair",
        "cdfc_member",
        "finance_officer",
        "wdc_member",
        "mp",
        "contractor",
        "citizen",
      ],
      bursary_status: [
        "submitted",
        "shortlisted",
        "approved",
        "disbursed",
        "rejected",
        "withdrawn",
      ],
      document_type: [
        "application",
        "invoice",
        "meeting_minutes",
        "approval_letter",
        "site_photo",
        "wdc_signoff",
        "procurement_bid",
        "contract",
        "completion_certificate",
        "other",
      ],
      grant_status: [
        "submitted",
        "under_review",
        "approved",
        "disbursed",
        "completed",
        "rejected",
      ],
      integration_status: ["active", "inactive", "error", "pending"],
      payment_status: [
        "draft",
        "submitted",
        "finance_review",
        "panel_a_pending",
        "panel_b_pending",
        "approved",
        "executed",
        "rejected",
        "cancelled",
      ],
      procurement_status: [
        "draft",
        "published",
        "bid_opening",
        "evaluation",
        "awarded",
        "contracted",
        "completed",
        "cancelled",
      ],
      project_sector: [
        "education",
        "health",
        "water",
        "roads",
        "agriculture",
        "community",
        "energy",
        "governance",
        "other",
      ],
      project_status: [
        "draft",
        "submitted",
        "cdfc_review",
        "tac_appraisal",
        "plgo_review",
        "approved",
        "implementation",
        "completed",
        "rejected",
        "cancelled",
      ],
      return_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "revision_required",
      ],
      risk_level: ["low", "medium", "high", "critical"],
    },
  },
} as const
