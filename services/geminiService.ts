
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Job, JobAnalysis, UserProfile } from "../types";
import { SYSTEM_INSTRUCTION, USER_PROFILE } from "../constants";

// Helper to get client safely in Vite/Vercel environment
const getApiKey = () => {
  let key = '';

  // 1. Try Vite standard (import.meta.env) safely
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      key = import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // ignore error if import.meta is not supported
  }

  // 2. Fallback to process.env (Node/Vercel standard)
  if (!key) {
    try {
      // @ts-ignore
      if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        key = process.env.API_KEY || process.env.VITE_API_KEY;
      }
    } catch (e) {
      // ignore error if process is not defined
    }
  }

  if (!key) {
    console.error("API Key missing. Environment dump:", { 
      // @ts-ignore
      vite: typeof import.meta !== 'undefined' ? import.meta.env : 'undefined', 
      // @ts-ignore
      process: typeof process !== 'undefined' ? 'defined' : 'undefined' 
    });
    throw new Error("API Key not found. Please set VITE_API_KEY in your environment.");
  }
  return key;
};

const getClient = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey });
};

// Robust Retry utility for rate limits
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 5, baseDelay = 5000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Robust error checking for various Google API error formats
    // The API often returns: { error: { code: 429, message: "...", status: "RESOURCE_EXHAUSTED" } }
    const statusCode = error.status || error.response?.status || error.error?.code;
    const statusText = error.statusText || error.error?.status; // e.g. "RESOURCE_EXHAUSTED"
    const message = error.message || error.error?.message || '';

    // Convert error object to string just in case the key info is buried
    const errorString = JSON.stringify(error);

    const isRateLimit = 
        statusCode === 429 || 
        statusCode === 503 || 
        statusText === 'RESOURCE_EXHAUSTED' ||
        (typeof message === 'string' && (
            message.includes('429') || 
            message.includes('quota') || 
            message.includes('exceeded') || 
            message.includes('RESOURCE_EXHAUSTED')
        )) ||
        errorString.includes('RESOURCE_EXHAUSTED') ||
        errorString.includes('429');

    // NEW: Check for Daily Quota exhaustion (often 429 but message differs)
    // If we are strictly out of daily tokens, stop retrying to save time.
    if (typeof message === 'string' && message.includes('limit') && message.includes('day')) {
        console.error("Daily Quota Exceeded. Stopping retries.");
        throw error;
    }

    if (retries > 0 && isRateLimit) {
      // Exponential backoff with jitter: 5s, 10s, 20s, 40s...
      const attempt = 6 - retries;
      const delay = baseDelay * Math.pow(2, attempt - 1) + (Math.random() * 1000); 
      
      console.warn(`API Rate Limit hit (${statusCode || statusText}). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/5)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, baseDelay);
    }
    
    // If we run out of retries or it's not a rate limit, throw
    throw error;
  }
};

/**
 * Step 1: Search for Jobs using Google Search Grounding.
 * Uses the strict "Talent Scout" protocols.
 */
export const searchAndParseJobs = async (query: string): Promise<Job[]> => {
  const ai = getClient();
  
  const prompt = `
    ### ROLE DEFINITION
    You are an expert Talent Scout Agent specializing in UX, UI, and Product Design. Your goal is to identify high-quality **Mid-Level, Senior, and Leadership** opportunities.

    ### SEARCH QUERY CONTEXT
    "${query}"

    ### SEARCH STRATEGY
    **1. Broad UK Search**
    - Search for roles across the **United Kingdom**.
    - Do NOT filter out roles just because they are not in Edinburgh/Glasgow. Include London, Manchester, Remote, etc.

    **2. Seniority Logic (Relaxed)**
    - **TARGET**: Senior, Lead, Staff, Principal, Manager.
    - **ACCEPT**: "Product Designer" or "UX Designer" (generic titles) IF they appear to be standard mid-level roles (not junior).
    - **EXCLUDE**: Explicit "Intern", "Apprentice", "Trainee" roles.

    **3. Experience Verification (Description Scanning)**
    - **Keep** if you find: "2+ years", "3+ years", "5+ years", "autonomous", "own the process".
    - **Discard** if you find: "0-1 years", "recent graduate", "learning opportunity".

    **4. Location Logic**
    - **Primary**: Edinburgh, Glasgow.
    - **Secondary**: Remote (UK), London, Manchester, Bristol, Leeds.
    - **Action**: Grab the best roles regardless of city, we will filter later.

    ### CRITICAL: RECURSIVE DISCOVERY (harvest_related_jobs)
    You MUST simulate a "deep dive" into the search results.
    1.  **Analyze Search Grounding Text**: Look for text patterns like "People also viewed", "Similar jobs", "Related roles", or sidebars in the text content provided by the Google Search Tool.
    2.  **Extract Hidden Jobs**: Often the best jobs are in these "Related" lists. Extract them even if they weren't in the main search snippet.
    3.  **Flag Them**: Set 'is_related_job_discovery' to true for these found items.

    ### OUTPUT FORMAT
    Return a JSON array of the top 8-10 most relevant listings.
    
    The JSON structure must be:
    [
      {
        "job_title": "String",
        "company": "String",
        "seniority_score": "Mid | Senior | Lead",
        "source_url": "URL",
        "is_related_job_discovery": true/false,
        "summary": "Brief summary including years of experience found.",
        "posted_date": "Time posted (e.g. '2 days ago', 'Today')",
        "location": "City or Remote",
        "source": "Site Name (e.g. LinkedIn, Reed, Gov.uk)"
      }
    ]
    
    Output the JSON inside a markdown code block like \`\`\`json ... \`\`\`.
  `;

  try {
    // Increase retries for search specifically as it's the heaviest call
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash", // Use Flash for efficiency and search
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, 
      },
    }), 5, 5000); // 5 retries, start with 5s delay

    const text = response.text || "[]";
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    const cleanJson = jsonMatch ? jsonMatch[1] : text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let rawJobs;
    try {
        rawJobs = JSON.parse(cleanJson);
    } catch (e) {
        console.warn("Failed to parse search results JSON, trying to fix...", e);
        const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        rawJobs = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
    }
    
    if (!Array.isArray(rawJobs)) return [];

    // Map the "Snake Case" output from the prompt to our "Camel Case" TS interface
    return rawJobs.map((j: any, index: number) => ({
      id: `job-${Date.now()}-${index}`,
      title: j.job_title || j.title || "Unknown Role",
      company: j.company || "Unknown Company",
      location: j.location || "United Kingdom", 
      url: j.source_url || j.url || j.link || j.apply_link,
      summary: j.summary || "No description available.",
      source: j.source || "Web Search",
      postedDate: j.posted_date || j.postedDate || "Recently",
      seniorityScore: j.seniority_score || "Mid",
      isRelatedDiscovery: j.is_related_job_discovery || false
    }));

  } catch (error) {
    console.error("Error searching jobs (Quota Exceeded or Network Error):", error);
    // Return empty array instead of crashing, allowing UI to show safe state
    return [];
  }
};

/**
 * Step 2: Score the job based on the "Finance First" logic.
 */
export const analyzeJob = async (job: Job): Promise<JobAnalysis> => {
  const ai = getClient();
  const safeSummary = (job.summary || "").substring(0, 5000);

  const prompt = `
    Analyze this job for Vyom based on the System Instructions provided.
    
    Job Details:
    Title: ${job.title}
    Company: ${job.company}
    Location: ${job.location}
    Description: ${safeSummary}
    
    ### SCORING PROTOCOL
    1. **Industry Boost**:
       - **+20 POINTS** if Fintech, Insurance, Banking, Investment, Wealth Management.
       - **+10 POINTS** if Public Sector, Government, High-Growth Tech, or Agency.
    2. **Seniority/Salary Check**:
       - If generic title (e.g., "Product Designer"), check for signs of seniority: salary > £45k, "lead", "manage", "own the process", "mentor". If found, treat as Senior (High Score).
       - If "0-2 years", "recent grad" -> Score < 20.
    
    ### STRATEGY & VERDICT RULES
    - **Verdict**: Punchy 1-sentence summary indicating why it fits (or doesn't).
    - **Strategy**: YOU MUST Reference Vyom's specific background where relevant:
       - If Design Systems mentioned -> Reference "Trove Design System at HES".
       - If Impact/Transformation/Awards -> Reference "Bronze Digital Impact Award with Stonewater".
       - If Compliance/Regulated -> Reference "Intact Insurance compliance workflows".
       - If Accessibility -> Reference "WCAG work".

    CHECK: Location/Commute.
    - If London/Manchester and requires "3+ days/week", set isCommuteRisk: true.
    - If "1-2 days/month" or "occasional travel", set isCommuteRisk: false.

    Return a JSON object with this schema:
    {
      "score": number (0-100),
      "verdict": "string (1 sentence punchy summary)",
      "strategy": "string (Specific strategy referencing Vyom's experience)",
      "isHighValue": boolean (true if Finance/Insurance/Banking),
      "isCommuteRisk": boolean (true if strict onsite in non-Edinburgh city),
      "matchedKeywords": ["string", "string"]
    }
  `;

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            verdict: { type: Type.STRING },
            strategy: { type: Type.STRING },
            isHighValue: { type: Type.BOOLEAN },
            isCommuteRisk: { type: Type.BOOLEAN },
            matchedKeywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    }));

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error analyzing job:", error);
    return {
      score: 0,
      verdict: "Analysis failed",
      strategy: "Manual review required",
      isHighValue: false,
      isCommuteRisk: false,
      matchedKeywords: []
    };
  }
};

/**
 * Step 3: Generate Application Kit (Strategy, Resume Tips, Interview Prep, Cover Letter)
 */
export const generateApplicationKit = async (job: Job, analysis: JobAnalysis): Promise<string> => {
  const ai = getClient();

  const prompt = `
    Create a complete "Application Strategy Kit" for Vyom applying to:
    Role: ${job.title} at ${job.company}.
    
    Job Context: ${job.summary}
    Analysis: ${analysis.strategy}
    
    You must output a structured Markdown document with the following sections. Use bold headers.

    # 🎯 Application Strategy
    [A brief paragraph on how to position Vyom's Insurance/Fintech background for this specific role.]

    # 📄 Resume Adjustments
    [Bullet points on what to emphasize or tweak in his resume. E.g., "Move the Stonewater case study to the top", "Highlight compliance experience".]
    
    # ⚠️ Important Job Context
    [Key things to know about the company or tech stack based on the job description or general knowledge.]

    # 🎤 Interview Prep
    [3 Likely Interview Questions specific to this role and how Vyom should answer them using his experience.]

    # ✉️ Draft Cover Letter
    [A highly specific, senior-level cover letter. Under 250 words. Professional, confident, consultative. No fluff.]
    
    Output purely in Markdown.
  `;

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    }));

    return response.text || "Could not generate kit.";
  } catch (error) {
    console.error("Error generating kit:", error);
    return "# Error\nCould not generate application kit. Please try again.";
  }
};
