export interface Participant {
  id: string;
  account_instance_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  family: string | null;
  relationship: string | null;
  invited_by: string | null;
  tags: string[] | null;
  events: string[] | null;
  sub_events: string[] | null;
  additional_participants: any[] | null;
  is_child: boolean | null;
  child_age: number | null;
  custom_fields: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AdditionalParticipant {
  id: string;
  main_participant_id: string;
  account_instance_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  family: string | null;
  relationship: string | null;
  invited_by: string | null;
  tags: string[] | null;
  events: string[] | null;
  sub_events: string[] | null;
  is_child: boolean | null;
  child_age: number | null;
  custom_fields: Record<string, any> | null;
  created_at: string;
  updated_at: string;
} 