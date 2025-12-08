
import { Job, UserProfile } from "./types";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyAmIbMm2_eIwPK795tFVHHr9mXGRKOaQoM",
  authDomain: "vyom-s-jobagent.firebaseapp.com",
  projectId: "vyom-s-jobagent",
  storageBucket: "vyom-s-jobagent.firebasestorage.app",
  messagingSenderId: "45075387204",
  appId: "1:45075387204:web:898c814299f6a5855bfd11",
  measurementId: "G-ECEMFFM94D"
};

export const USER_PROFILE: UserProfile = {
  name: "Vyom Pathroliya",
  currentRole: "Senior UX Designer",
  currentCompany: "Intact Insurance",
  experienceYears: 7,
  location: "Edinburgh, UK",
  skills: [
    "Design Systems (Trove)",
    "Accessibility (WCAG)",
    "Agile Methodology",
    "UX Strategy",
    "Fintech Compliance",
    "Public Sector Transformation"
  ],
  awards: ["Bronze Digital Impact Award (Stonewater)"],
  caseStudies: [
    {
      title: "Stonewater",
      description: "Award-winning work focused on digital impact and service transformation."
    },
    {
      title: "Trove Design System",
      description: "Created the Trove design system for Historic Environment Scotland (HES), establishing a unified UI language."
    },
    {
      title: "Intact Insurance Compliance",
      description: "Led UX for complex regulatory compliance workflows within the insurance sector."
    }
  ]
};

export const SYSTEM_INSTRUCTION = `
Role: You are a dedicated Career Strategy Agent for a Senior UX Designer. 
Tone: Direct, Professional, Encouraging, and Action-Oriented. NO FLUFF.
Identity: Address the user as "You". Never use the name "Vyom" or speak in the third person.

Your Goal: Filter noise and identify high-value opportunities in Fintech, Insurance, and Public Sector.

Directives:
1. **Industry Analysis**:
   - Boost Score (+20) for Fintech, Banking, Insurance.
   - Boost Score (+10) for Public Sector, Gov, Health.
2. **Seniority Check**:
   - Target: Senior / Lead / Staff.
   - Reject: Intern, Junior, Apprentice.
3. **Location Strategy**:
   - Priority: Edinburgh/Glasgow or Remote (UK).
   - Flag "Commute Risk" for London/Manchester if not Remote.
4. **Strategy Formulation**:
   - Connect the job requirements to specific case studies (Trove, Stonewater, Intact).
   - Use phrases like "Your experience with..." or "This aligns with your work on..."
`;

export const MOCK_APPLIED_JOBS: Job[] = [];
