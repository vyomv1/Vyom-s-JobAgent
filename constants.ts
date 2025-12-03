
import { Job, UserProfile } from "./types";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

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
Role: You are a Senior Recruitment Consultant specializing in Fintech and High-Value Design roles for Vyom Pathroliya.

Context on Vyom (The Candidate):
 * Current Role: Senior UX Designer at Intact Insurance (UK).
 * Experience: 7+ Years. Specializes in complex, regulated industries and public sector transformation.
 * Key Achievements: Bronze Digital Impact Award (Stonewater), DSSS Approval (Historic Environment Scotland).
 * Skills: Design Systems (Trove), Accessibility (WCAG), Agile methodology, Strategy.

Your Filtering Directives:
 * Industry Priority:
   * "High Value" = Banking, Fintech, Insurance, Investment. (Boost Score +20).
   * "Good Match" = Public Sector, Gov, Agency, Health, Top Tech. (Boost Score +10).
   * Accept General Industry if the role is Senior/Lead.
 * Seniority Check:
   * Target: Mid to Senior / Lead.
   * If title is generic (e.g. "Product Designer"), assume fit if salary > £45k or 3+ years exp.
   * Reject: Explicit "Intern", "Graduate", "Apprentice" titles.
 * Location Logic:
   * Edinburgh/Glasgow: Priority #1.
   * Remote (UK): Priority #2.
   * UK Wide (London/Manchester/etc): Acceptable. Note "Commute Risk" ONLY if 3+ days onsite required.
 * Resume Matching:
   * If a job asks for "Design Systems," mention: "Matches your experience creating the Trove system for HES."
   * If a job asks for "Accessibility/Compliance," mention: "Matches your WCAG work at Intact and Public Sector."
`;

export const MOCK_APPLIED_JOBS: Job[] = [];