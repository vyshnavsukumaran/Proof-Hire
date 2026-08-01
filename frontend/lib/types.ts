export type Role = "candidate" | "employer";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  created_at: string;
}

export interface Skill {
  id: number;
  name: string;
  category?: string | null;
}

export interface CandidateProfile {
  id: number;
  headline?: string | null;
  summary?: string | null;
  years_experience?: number | null;
  visibility?: string;
  total_views?: number;
}

export interface Project {
  id: number;
  title: string;
  project_type: string;
  role?: string | null;
  problem?: string | null;
  contribution?: string | null;
  process?: string | null;
  outcome?: string | null;
  tools?: string | null;
  media_url?: string | null;
  project_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  visibility?: string;
  likes: number;
  views: number;
  created_at: string;
  skills: Skill[];
}

export interface UserWithProfile extends User {
  profile?: CandidateProfile | null;
  skills: Skill[];
  project_count: number;
  projects: Project[];
}

export interface Job {
  id: number;
  employer_id: number;
  employer_name: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  required_skills?: string | null;
  required_skill_list: string[];
  experience_level: string;
  employment_type: string;
  location?: string | null;
  remote: boolean;
  salary_min?: number | null;
  salary_max?: number | null;
  status: string;
  created_at: string;
}

export interface Application {
  id: number;
  job_id: number;
  job_title: string;
  candidate_id: number;
  candidate_name: string;
  candidate_headline: string;
  cover_letter?: string | null;
  evidence_project_ids?: string | null;
  evidence_projects: Project[];
  status: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  job_id?: number | null;
  job_title: string;
  candidate_id: number;
  candidate_name: string;
  employer_id: number;
  employer_name: string;
  last_message?: string | null;
  last_message_at?: string | null;
  unread: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  read: boolean;
  created_at: string;
}

export interface ShortlistEntry {
  id: number;
  employer_id: number;
  candidate_id: number;
  candidate?: UserWithProfile | null;
  status: string;
  notes?: string | null;
  score?: number | null;
  created_at: string;
}

export interface Recommendation {
  id: number;
  title: string;
  score: number;
  reason: string;
  detail: Record<string, unknown>;
}

export interface Analytics {
  total_views: number;
  total_project_views: number;
  total_likes: number;
  application_count: number;
  interview_count: number;
  offer_count: number;
  top_projects: { id: number; title: string; views: number; likes: number }[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  role: Role;
  name: string;
}
