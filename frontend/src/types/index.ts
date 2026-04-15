export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'club_admin' | 'super_admin';
  interests: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  admin_id: string;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  member_count: number;
}

export interface ClubMember {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: string;
  joined_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  club_id: string;
  club_name: string;
  statement: string;
  status: 'pending' | 'accepted' | 'rejected';
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface Event {
  id: string;
  club_id: string;
  club_name: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string;
  qr_token: string;
  qr_image_base64?: string;
  max_attendees: number | null;
  attendance_count: number;
  created_at: string;
}

export interface Attendance {
  id: string;
  event_id: string;
  event_title: string;
  user_id: string;
  user_name: string;
  checked_in_at: string;
}

export interface Recommendation {
  club_id: string;
  club_name: string;
  category: string;
  match_score: number;
  reason: string;
}

export interface ChatResponse {
  reply: string;
}

export interface OverviewStats {
  total_users: number;
  total_clubs: number;
  total_events: number;
  total_applications: number;
  pending_applications: number;
  total_attendance_records: number;
}

export interface ClubStats {
  club_name: string;
  member_count: number;
  event_count: number;
  application_count: number;
  total_attendance: number;
}

export interface StudentStats {
  clubs_joined: number;
  events_attended: number;
  applications_submitted: number;
}
