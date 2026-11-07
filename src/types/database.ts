export type ServiceType = "makeup" | "hair";
export type AppointmentStatus =
  "unscheduled" | "proposed" | "confirmed" | "pending_confirmation";
export type Vendor = {
  id: string;
  name: string;
  service_type: ServiceType;
  additional_details?: string | null;
};
export type Participant = {
  id: string;
  name: string;
  arrival_time: string | null;
  ready_by: string | null;
};
export type AppointmentRow = {
  id: string;
  participant_id: string;
  vendor_id: string;
  service_type: ServiceType;
  start_time: string | null;
  end_time: string | null;
  status: AppointmentStatus;
};
export interface Appointment extends AppointmentRow {
  participant: Participant;
  vendor: Vendor;
}
export type WeddingEventRow = {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
};
type Table<Row> = { Row: Row; Insert: never; Update: never; Relationships: [] };
export interface Database {
  public: {
    Tables: {
      wedding_events: Omit<Table<WeddingEventRow>, "Insert" | "Update"> & {
        Insert: { title: string; start_time: string; end_time?: string | null };
        Update: Partial<
          Pick<WeddingEventRow, "title" | "start_time" | "end_time">
        >;
      };
      vendors: Omit<Table<Vendor>, "Update"> & {
        Update: { additional_details?: string | null };
      };
      participants: Table<Participant>;
      appointments: Omit<Table<AppointmentRow>, "Update" | "Relationships"> & {
        Update: Partial<
          Pick<AppointmentRow, "start_time" | "end_time" | "status">
        >;
        Relationships: [
          {
            foreignKeyName: "appointments_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
