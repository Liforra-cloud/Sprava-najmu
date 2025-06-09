//types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          name: string
          address: string
          description: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          address: string
          description?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string
          description?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          id: string
          identifier: string
          floor: number | null
          disposition: string
          area: number | null
          occupancy_status: string | null
          monthly_rent: number | null
          deposit: number | null
          date_added: string
          property_id: string
          user_id: string | null
        }
        Insert: {
          id?: string
          identifier: string
          floor?: number | null
          disposition: string
          area?: number | null
          occupancy_status?: string | null
          monthly_rent?: number | null
          deposit?: number | null
          date_added?: string
          property_id: string
          user_id?: string | null
        }
        Update: {
          id?: string
          identifier?: string
          floor?: number | null
          disposition?: string
          area?: number | null
          occupancy_status?: string | null
          monthly_rent?: number | null
          deposit?: number | null
          date_added?: string
          property_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'units_property_id_fkey'
            columns: ['property_id']
            referencedRelation: 'properties'
            referencedColumns: ['id']
          }
        ]
      }
    }
  }
}
