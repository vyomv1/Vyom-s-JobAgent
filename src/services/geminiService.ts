
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Job, JobAnalysis } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

const getClient = () => {
    let apiKey = '';
    try { // @ts-ignore
      apiKey = import.meta.env.VITE_API_KEY;
    } catch (e) {}
    if (!apiKey) {
      try { // @ts-ignore
        apiKey = process.env.VITE_API_KEY || process.env.API_KEY;
      } catch (e) {}
    }
    if (!apiKey) throw new Error("API Key not found.");
    return new GoogleGenAI({ apiKey });
};

const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 5, baseDelay = 5000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const statusCode = error.status || error.response?.status || error.error?.code;
    const statusText = error.statusText || error.error?.status;
    const message = error.message || error.error?.message || '';
    const isRateLimit = statusCode === 429 || statusCode === 503 || statusText === 'RESOURCE_EXHAUSTED' || message.includes('quota');

    if (retries > 0 && isRateLimit) {
      const delay = baseDelay * Math.pow(2, 5 - retries);
      console.warn(`API Rate Limit. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, baseDelay);
    }
    throw error;
  }
};

export const searchAndParseJobs = async (query: string): Promise<Job[]> => {
  const ai = getClient();
  const prompt = `
    ### ROLE DEFINITION
    You are an expert Talent Scout Agent. Your goal is to identify high-quality Mid-Level, Senior, and Leadership UX/Product Design opportunities.
    ### SEARCH QUERY
    "${query}"
    ### SEARCH STRATEGY
    1.  **Broad UK Search**: Find roles across the UK, including London, Manchester, Remote, etc.
    2.  **Seniority**: Target "Senior", "Lead", "Staff", but accept generic titles like "Product Designer". Exclude explicit "Intern", "Apprentice" roles.
    3.  **Data Capture**: For each job, find **SALARY** and **WORK PATTERN** (Hybrid/Remote) and put it in the summary.
    4.  **Recursive Discovery**: Analyze search results for "People also viewed" or "Similar jobs" to find hidden roles and flag them.
    ### OUTPUT FORMAT
    Return a JSON array of 8-10 listings in a markdown code block.
    [{"job_title": "String", "company": "String", "seniority_score": "Mid|Senior|Lead", "source_url": "URL", "is_related_job_discovery": boolean, "summary": "String", "posted_date": "String", "location": "String", "source": "String"}]
  `;
  const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] } }));
  const text = response.text || "[]";
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
  const cleanJson = jsonMatch ? jsonMatch[1] : text.replace(/```json/g, '').replace(/```/g, '').trim();
  let rawJobs = [];
  try {
    rawJobs = JSON.parse(cleanJson);
  } catch(e) { console.error("JSON Parse Error in search", e); }
  return rawJobs.map((j: any) => ({
    id: `job-${Date.now()}-${Math.random()}`,
    title: j.job_title || "Unknown", company: j.company || "Unknown",
    location: j.location || "UK", url: j.source_url, summary: j.summary || "",
    source: j.source || "Web", postedDate: j.posted_date, seniorityScore: j.seniority_score,
    isRelatedDiscovery: j.is_related_job_discovery
  }));
};

export const analyzeJob = async (job: Job): Promise<JobAnalysis> => {
  const ai = getClient();
  const safeSummary = (job.summary || "").substring(0, 5000);
  const prompt = `
    Analyze this job for the user based on the System Instructions. 
    **CRITICAL**: ADDRESS THE USER AS "YOU". DO NOT USE "VYOM".

    Job: ${job.title} at ${job.company}. Summary: ${safeSummary}
    
    ### EXTRACTION & CLASSIFICATION
    1.  **Industry**: Classify the COMPANY into one of these specific buckets:
        - "Fintech & Banking" (Banks, Wealth, Trading, Crypto)
        - "Insurance" (Underwriting, Claims, Life, Pension)
        - "Public Sector" (Gov, Council, NHS, Education, Charity)
        - "Agency & Consulting" (Design Studios, Digital Agencies, Consultancies)
        - "Retail & E-commerce"
        - "Media & Entertainment"
        - "Energy & Utilities"
        - "Tech & Product" (SaaS, Apps, Startups)
        - "Other"
    2.  **Work Pattern**: Extract "Remote", "Hybrid", or "On-site".
    3.  **Experience**: Extract years required (e.g., "5+ years").
    4.  **Salary**: Extract pay range (e.g., "£60k - £70k").

    ### SCORING & STRATEGY
    - **Score**: Apply industry boosts (+20 for Fintech/Insurance, +10 for Public Sector).
    - **Verdict (Executive Summary)**: Write a sharp, 3-sentence Executive Summary suitable for a Senior Designer. Focus on the BUSINESS CHALLENGE this role solves and the STRATEGIC FIT. Do not just repeat the requirements. Frame it as an opportunity.
    - **Strategy**: YOU MUST connect the job to **your** specific achievements (Trove, Stonewater, Intact) using "Your".

    Return a JSON object with this EXACT schema:
    { "score": number, "verdict": "string", "strategy": "string", "isHighValue": boolean, "isCommuteRisk": boolean, "matchedKeywords": ["string"], "workPattern": "string", "experienceRequired": "string", "salary": "string", "industry": "string" }
  `;

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
          score: { type: Type.NUMBER }, verdict: { type: Type.STRING },
          strategy: { type: Type.STRING }, isHighValue: { type: Type.BOOLEAN },
          isCommuteRisk: { type: Type.BOOLEAN }, workPattern: { type: Type.STRING },
          experienceRequired: { type: Type.STRING }, salary: { type: Type.STRING },
          industry: { type: Type.STRING },
          matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  }));

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("JSON Parse Error in analysis:", e);
    return {
      score: 0, verdict: "Analysis failed.", strategy: "Could not parse AI response.",
      isHighValue: false, isCommuteRisk: false, matchedKeywords: []
    };
  }
};

export const generateApplicationKit = async (job: Job, analysis: JobAnalysis): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Create a deep, executive-level "Application Strategy Kit" for the user applying to:
    Role: ${job.title} at ${job.company}.
    Job Summary: ${job.summary}
    Initial Strategy: ${analysis.strategy}
    
    ACT AS: A Senior Product Design Hiring Manager at a top-tier tech firm.
    
    PROVIDE THE FOLLOWING SECTIONS (Use Markdown):
    
    # 🎯 The Hiring Manager's Mindset
    (Reveal what they are *actually* scared of for this specific role, e.g., "They are afraid of a designer who slows down shipping.")
    
    # 🔑 The 'Trojan Horse' Strategy
    (A unique angle to pitch myself that other candidates won't think of. Connect my background in Design Systems (Trove) or Compliance (Intact) specifically to their needs.)
    
    # 📝 Resume Micro-Adjustments
    (3 specific bullets to re-write on my CV. Show "Before" vs "After".)
    
    # 🎤 Behavioral Interview Prep
    (3 specific, difficult questions they will ask. Provide the "STAR" points I should hit for each.)
    
    # ✉️ High-Signal Cover Letter
    (A draft that is SHORT, PUNCHY, and devoid of fluff. No "I am writing to apply". Start with value.)
    
    TONE: Inside baseball, tactical, no corporate jargon. Address user as "You".
  `;
  const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({ model: "gemini-3-pro-preview", contents: prompt, config: { systemInstruction: SYSTEM_INSTRUCTION } }));
  return response.text || "Could not generate kit.";
};

export const improveCV = async (currentCv: string, instruction: string): Promise<string> => {
    const ai = getClient();
    const prompt = `
      You are an expert CV writer for Senior Designers. 
      Action: ${instruction}
      
      Current Text:
      "${currentCv}"
      
      Return ONLY the rewritten text. Maintain markdown formatting if present. Keep it professional, punchy, and result-oriented.
    `;
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({ 
        model: "gemini-2.5-flash", 
        contents: prompt,
        config: { systemInstruction: "Act as a Senior Resume Writer. Output only the revised text." }
    }));
    return response.text || currentCv;
};

export const expandJobDescription = async (job: Job): Promise<string> => {
    // Function disabled as per user request to use original description
    return job.summary;
};
