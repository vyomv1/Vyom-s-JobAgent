
export interface Attachment {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 string
  size: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url?: string;
  summary: string;
  source: string;
  status?: 'new' | 'saved' | 'applied' | 'assessment' | 'interview' | 'offer' | 'archived';
  notes?: string; // Can contain HTML
  attachments?: Attachment[];
  appliedDate?: string;
  postedDate?: string; // e.g., "2 days ago"
  scoutedAt?: number; // Timestamp for auto-archiving
  seniorityScore?: 'Mid' | 'Senior' | 'Lead';
  isRelatedDiscovery?: boolean;
  analysis?: JobAnalysis;
}

export interface JobAnalysis {
  score: number;
  verdict: string;
  strategy: string;
  isHighValue: boolean;
  isCommuteRisk: boolean;
  matchedKeywords: string[];
  workPattern?: string; // e.g. "Hybrid - 2 days", "Remote"
  experienceRequired?: string; // e.g. "5+ years"
  salary?: string; // e.g. "£60k - £80k"
  industry?: string; // e.g. "Fintech", "Public Sector"
}

export interface UserProfile {
  name: string;
  currentRole: string;
  currentCompany: string;
  experienceYears: number;
  skills: string[];
  caseStudies: {
    title: string;
    description: string;
  }[];
  awards: string[];
  location: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  KANBAN = 'KANBAN',
  CV_EDITOR = 'CV_EDITOR',
}

export interface SearchFilters {
  location: string;
  keywords: string[];
}
