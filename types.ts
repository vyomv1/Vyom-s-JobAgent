export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url?: string;
  summary: string;
  source: string;
  status?: 'new' | 'applied';
  appliedDate?: string;
  postedDate?: string; // e.g., "2 days ago"
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
  COVER_LETTER = 'COVER_LETTER',
}

export interface SearchFilters {
  location: string;
  keywords: string[];
}