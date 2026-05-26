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
      embalagens: {
        Row: {
          capacidade: number
          created_at: string
          id: string
          preco_unitario: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capacidade: number
          created_at?: string
          id?: string
          preco_unitario: number
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capacidade?: number
          created_at?: string
          id?: string
          preco_unitario?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      frete_produtos: {
        Row: {
          created_at: string
          frete_id: string
          id: string
          produto_id: string
          produtor_id: string
          quantidade: number
          user_id: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          frete_id: string
          id?: string
          produto_id: string
          produtor_id: string
          quantidade: number
          user_id: string
          valor_total: number
          valor_unitario: number
        }
        Update: {
          created_at?: string
          frete_id?: string
          id?: string
          produto_id?: string
          produtor_id?: string
          quantidade?: number
          user_id?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: []
      }
      fretes: {
        Row: {
          created_at: string
          data_frete: string
          destino: string
          distancia_km: number | null
          id: string
          observacoes: string | null
          origem: string
          produtor_id: string | null
          status: string
          updated_at: string
          user_id: string
          valor_frete: number
        }
        Insert: {
          created_at?: string
          data_frete: string
          destino: string
          distancia_km?: number | null
          id?: string
          observacoes?: string | null
          origem: string
          produtor_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor_frete: number
        }
        Update: {
          created_at?: string
          data_frete?: string
          destino?: string
          distancia_km?: number | null
          id?: string
          observacoes?: string | null
          origem?: string
          produtor_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor_frete?: number
        }
        Relationships: [
          {
            foreignKeyName: "fretes_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes_realizadas: {
        Row: {
          created_at: string
          data_realizacao: string
          id: string
          km_veiculo: number
          observacoes: string | null
          oficina: string | null
          tipo_manutencao_id: string
          updated_at: string
          user_id: string
          valor: number
          veiculo_id: string
        }
        Insert: {
          created_at?: string
          data_realizacao: string
          id?: string
          km_veiculo: number
          observacoes?: string | null
          oficina?: string | null
          tipo_manutencao_id: string
          updated_at?: string
          user_id: string
          valor: number
          veiculo_id: string
        }
        Update: {
          created_at?: string
          data_realizacao?: string
          id?: string
          km_veiculo?: number
          observacoes?: string | null
          oficina?: string | null
          tipo_manutencao_id?: string
          updated_at?: string
          user_id?: string
          valor?: number
          veiculo_id?: string
        }
        Relationships: []
      }
      produtores: {
        Row: {
          cidade: string | null
          cpf_cnpj: string
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cidade?: string | null
          cpf_cnpj: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cidade?: string | null
          cpf_cnpj?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_unitario: number
          unidade_medida: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_unitario: number
          unidade_medida?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_unitario?: number
          unidade_medida?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tipos_manutencao: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          periodicidade_dias: number | null
          periodicidade_km: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          periodicidade_dias?: number | null
          periodicidade_km?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          periodicidade_dias?: number | null
          periodicidade_km?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: number
          created_at: string
          id: string
          km_atual: number
          marca: string
          modelo: string
          observacoes: string | null
          placa: string
          status: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          km_atual?: number
          marca: string
          modelo: string
          observacoes?: string | null
          placa: string
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          km_atual?: number
          marca?: string
          modelo?: string
          observacoes?: string | null
          placa?: string
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendas_embalagens: {
        Row: {
          created_at: string
          data_venda: string
          id: string
          produtor_id: string | null
          quantidade: number
          tipo_embalagem: string
          updated_at: string
          user_id: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          data_venda: string
          id?: string
          produtor_id?: string | null
          quantidade: number
          tipo_embalagem: string
          updated_at?: string
          user_id: string
          valor_total: number
          valor_unitario: number
        }
        Update: {
          created_at?: string
          data_venda?: string
          id?: string
          produtor_id?: string | null
          quantidade?: number
          tipo_embalagem?: string
          updated_at?: string
          user_id?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_embalagens_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
        ]
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
