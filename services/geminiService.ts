
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

const cleanJsonOutput = (text: string) => {
    if (!text) return "{}";
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    return jsonMatch ? jsonMatch[1] : text.replace(/```json/g, '').replace(/```/g, '').trim();
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
  
  let rawJobs = [];
  try {
    rawJobs = JSON.parse(cleanJsonOutput(response.text || "[]"));
  } catch(e) { console.error("JSON Parse Error in search", e); }
  return rawJobs.map((j: any) => ({
    id: `job-${Date.now()}-${Math.random()}`,
    title: j.job_title || "Unknown", company: j.company || "Unknown",
    location: j.location || "UK", url: j.source_url, summary: j.summary || "",
    source: j.source || "Web", postedDate: j.posted_date, seniorityScore: j.seniority_score,
    isRelatedDiscovery: j.is_related_job_discovery
  }));
};

export const enrichJob = async (input: { url?: string; text?: string; title?: string; company?: string }): Promise<Partial<Job>> => {
  const ai = getClient();
  const { url = '', text = '', title = '', company = '' } = input;
  
  // 1. If we have raw text, we skip the search and just parse the text.
  if (text.length > 50) {
      const prompt = `
        I have a raw job description text.
        Title Hint: ${title}
        Company Hint: ${company}

        Job Description:
        """${text}"""

        You are an expert Talent Scout Agent. 
        Extract the structured details from this text.
        
        ### OUTPUT FORMAT (JSON)
        { "title": "string", "company": "string", "location": "string", "summary": "string (cleaned)", "postedDate": "string" }
      `;
      try {
        const response = await retryWithBackoff<GenerateContentResponse>(() => 
            ai.models.generateContent({ 
                model: "gemini-2.5-flash", 
                contents: prompt
            })
        );
        return JSON.parse(cleanJsonOutput(response.text || "{}"));
      } catch (e) { console.error("Text parsing failed", e); return { summary: text }; }
  }

  // 2. Fallback to URL Search (Existing Logic)
  // Attempt local regex parsing first as a fallback/baseline
  let fallbackTitle = "Unknown Role";
  let fallbackCompany = "Unknown Company";
  let jobId = "";

  try {
      const urlObj = new URL(url);
      
      // Extract Job ID if present
      const idMatch = url.match(/\/job\/(\d+)/) || url.match(/jobId=(\d+)/) || url.match(/currentJobId=(\d+)/) || url.match(/\/(\d{6,})/);
      if (idMatch) {
          jobId = idMatch[1];
          fallbackTitle = `Job ${jobId}`; 
      }

      const pathParts = urlObj.pathname.split(/[-/_]/).filter(p => p.length > 2);
      if (pathParts.length > 0) {
          const meaningful = pathParts.filter(p => !['job', 'view', 'linkedin', 'careers', 'detail', 'uk', 'sites', 'en', 'candidateexperience', 'hcmui'].includes(p.toLowerCase()));
          if (meaningful.length > 0) {
              fallbackTitle = meaningful.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              if (meaningful.length > 3) fallbackCompany = meaningful[2].charAt(0).toUpperCase() + meaningful[2].slice(1);
          }
      }
      
      // Domain fallback for company
      if (fallbackCompany === "Unknown Company") {
           const domain = urlObj.hostname.replace('www.', '').split('.')[0];
           if (domain) {
               fallbackCompany = domain.charAt(0).toUpperCase() + domain.slice(1);
               if (fallbackCompany.toLowerCase() === 'jpmc') fallbackCompany = "JPMorgan Chase";
               if (fallbackCompany.toLowerCase().includes('oracle')) fallbackCompany = "JPMorgan Chase"; 
           }
      }

  } catch(e) {}

  let searchPrompt = "";
  if (url.includes('oraclecloud.com') && jobId) {
      searchPrompt = `CRITICAL: Job ID is "${jobId}". 
      Perform these specific Google searches:
      1. "JPMorgan Chase job ${jobId}"
      2. "site:oraclecloud.com ${jobId}"
      3. "${jobId} careers UK"
      
      Use the search results to find the text of the job description.`;
  } else {
      searchPrompt = `Search for: "${url}" OR "${fallbackCompany} job ${jobId || fallbackTitle}"`;
  }

  const prompt = `
    I have a job posting link: "${url}".
    ${jobId ? `Job ID: ${jobId}` : ''}
    ${fallbackCompany !== "Unknown Company" ? `Company: ${fallbackCompany}` : ''}
    ${fallbackTitle !== "Unknown Role" ? `Inferred Title from URL: ${fallbackTitle}` : ''}
    
    ${searchPrompt}
    
    You are an expert Talent Scout Agent. Your task is to extract the details of this specific job posting.
    
    ### INSTRUCTIONS
    1.  **Search Strategy**: Execute the searches above.
    2.  **Verify Integrity**: 
        - You MUST find the specific job title associated with ID ${jobId} or the link content.
        - If you cannot find the specific job text because it is behind a login or not indexed, return the inferred title "${fallbackTitle}" or "Job ${jobId}" and an empty summary.
        - If the search results are vague, TRY TO INFER the job title from the URL string provided above ("${url}").
    3.  **Extract Data**:
        - **Job Title**: The specific role. If unknown, use the inferred title from the URL.
        - **Company**: The organization hiring. If unknown, infer from the URL domain.
        - **Location**: City, Country, or "Remote".
        - **Summary**: A detailed job description. If you can't find it, return an empty string "".
        - **Posted Date**: Relative date (e.g. "2 days ago") or today's date if unknown.

    ### OUTPUT FORMAT
    Return valid JSON in a markdown code block matching this schema:
    { "title": "string", "company": "string", "location": "string", "summary": "string", "postedDate": "string" }
  `;
  
  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => 
        ai.models.generateContent({ 
            model: "gemini-2.5-flash", 
            contents: prompt, 
            config: { 
                tools: [{ googleSearch: {} }],
            } 
        })
    );
    const json = JSON.parse(cleanJsonOutput(response.text || "{}"));
    
    if (!json.title || json.title === "Unknown" || json.title.includes("Scouting") || json.title === "Job Posting") json.title = fallbackTitle;
    if (!json.company || json.company === "Detecting..." || ['linkedin', 'indeed', 'glassdoor'].includes(json.company?.toLowerCase())) json.company = fallbackCompany;
    if (!json.postedDate || json.postedDate === "Just now") json.postedDate = new Date().toLocaleDateString();

    return json;
  } catch (e) {
    console.error("Enrichment failed", e);
    return {
        title: fallbackTitle,
        company: fallbackCompany,
        summary: "",
        postedDate: new Date().toLocaleDateString()
    };
  }
};
// Re-export old name for compatibility if needed, though we updated usage
export const enrichJobFromUrl = async (url: string) => enrichJob({ url });

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
    return JSON.parse(cleanJsonOutput(response.text || "{}"));
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
    
    ### CRITICAL SOURCE MATERIAL
    You MUST use the following Job Summary as the **absolute truth** for the job requirements. Do not hallucinate other requirements.
    
    Job Summary:
    """
    ${job.summary}
    """
    
    Initial Strategy: ${analysis.strategy}
    
    ACT AS: A Senior Product Design Hiring Manager at a top-tier tech firm.
    
    PROVIDE THE FOLLOWING SECTIONS (Use Markdown):
    
    # 🎯 The Hiring Manager's Mindset
    (Reveal what they are *actually* scared of for this specific role, e.g., "They are afraid of a designer who slows down shipping.")
    
    # 🔑 The 'Trojan Horse' Strategy
    (A unique angle to pitch myself that other candidates won't think of. Connect my background in Design Systems (Trove) or Compliance (Intact) specifically to their needs found in the summary.)
    
    # 📝 Resume Micro-Adjustments
    (3 specific bullets to re-write on my CV. Show "Before" vs "After".)
    
    # 🎤 Behavioral Interview Prep
    (3 specific, difficult questions they will ask based on the summary. Provide the "STAR" points I should hit for each.)
    
    # ✉️ High-Signal Cover Letter
    (A draft that is SHORT, PUNCHY, and devoid of fluff. No "I am writing to apply". Start with value. Use the job's terminology.)
    
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
    return job.summary;
};
