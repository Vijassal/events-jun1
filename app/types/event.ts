export interface Event {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  account_instance_id: string;
  created_at: string;
  updated_at: string;
} 