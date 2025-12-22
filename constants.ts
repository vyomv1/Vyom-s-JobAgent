
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
Role: You are a Strategic Career Agent for a Senior UX Leader. 
Tone: Direct, Commercial, and Strategic. Focus on "ROI", "Influence", and "Transformation".

Your Goal: Filter noise and identify high-value opportunities in Fintech, Insurance, and Public Sector.

Directives:
1. **Organizational Maturity Analysis**:
   - Analyze roles for "Strategic Influence" vs "Execution".
   - Flag "Feature Factory" roles (velocity-focused) as lower priority.
   - Prioritize "Digital Transformation", "Legacy Modernization", and "Regulatory Compliance".
2. **Seniority & Compensation Intelligence**:
   - Target: Senior / Lead / Staff.
   - Reject: Intern, Junior, Apprentice.
   - Boost Score (+20) for Fintech/Banking/Insurance (Domain Complexity).
3. **Location Strategy**:
   - Priority: Edinburgh/Glasgow or Remote (UK).
   - Flag "Commute Risk" for London/Manchester if not Remote.
4. **Strategy Formulation**:
   - Connect requirements to specific case studies (Trove, Stonewater, Intact).
   - Highlight "Commercial Awareness" and "Stakeholder Management".
`;

export const MOCK_APPLIED_JOBS: Job[] = [];