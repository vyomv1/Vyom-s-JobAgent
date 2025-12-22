
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Job, JobAnalysis } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

const getClient = () => {
    // Guidelines: Use process.env.API_KEY directly and initialize via named parameter.
    const apiKey = process.env.API_KEY;
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

export const searchAndParseJobs = async (role: string, location: string): Promise<Job[]> => {
  const ai = getClient();
  const query = `("${role}") "${location}" -Intern -Trainee -Apprentice`;
  const prompt = `
    ### ROLE DEFINITION
    You are an expert Talent Scout Agent. Your goal is to identify high-quality Mid-Level, Senior, and Leadership UX/Product Design opportunities.
    ### SEARCH QUERY
    "${query}"
    ### SEARCH STRATEGY
    1.  **Broad Search**: Find roles matching the role and location specified.
    2.  **Seniority**: Target "Senior", "Lead", "Staff", but accept generic titles like "Product Designer". Exclude explicit "Intern", "Apprentice" roles.
    3.  **Data Capture**: For each job, find **SALARY** and **WORK PATTERN** (Hybrid/Remote) and put it in the summary.
    4.  **Recursive Discovery**: Analyze search results for "People also viewed" or "Similar jobs" to find hidden roles and flag them.
    ### OUTPUT FORMAT
    Return a JSON array of 8-10 listings in a markdown code block.
    [{"job_title": "String", "company": "String", "seniority_score": "Mid|Senior|Lead", "source_url": "URL", "is_related_job_discovery": boolean, "summary": "String", "posted_date": "String", "location": "String", "source": "String"}]
  `;
  // Using gemini-3-flash-preview for basic text and search tasks as recommended.
  const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({ 
    model: "gemini-3-flash-preview", 
    contents: prompt, 
    config: { tools: [{ googleSearch: {} }] } 
  }));
  
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
        // Using gemini-3-flash-preview for general text extraction.
        const response = await retryWithBackoff<GenerateContentResponse>(() => 
            ai.models.generateContent({ 
                model: "gemini-3-flash-preview", 
                contents: prompt
            })
        );
        return JSON.parse(cleanJsonOutput(response.text || "{}"));
      } catch (e) { console.error("Text parsing failed", e); return { summary: text }; }
  }

  let fallbackTitle = "Unknown Role";
  let fallbackCompany = "Unknown Company";
  let jobId = "";

  try {
      const urlObj = new URL(url);
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
      if (fallbackCompany === "Unknown Company") {
           const domain = urlObj.hostname.replace('www.', '').split('.')[0];
           if (domain) {
               fallbackCompany = domain.charAt(0).toUpperCase() + domain.slice(1);
               if (fallbackCompany.toLowerCase() === 'jpmc') fallbackCompany = "JPMorgan Chase";
           }
      }
  } catch(e) {}

  let searchPrompt = "";
  if (url.includes('oraclecloud.com') && jobId) {
      searchPrompt = `CRITICAL: Job ID is "${jobId}". 
      Perform these specific Google searches:
      1. "JPMorgan Chase job ${jobId}"
      2. "site:oraclecloud.com ${jobId}"
      3. "${jobId} careers UK"`;
  } else {
      searchPrompt = `Search for: "${url}" OR "${fallbackCompany} job ${jobId || fallbackTitle}"`;
  }

  const prompt = `
    I have a job posting link: "${url}".
    ${searchPrompt}
    Return valid JSON:
    { "title": "string", "company": "string", "location": "string", "summary": "string", "postedDate": "string" }
  `;
  
  try {
    // Using gemini-3-flash-preview for search-grounded enrichment.
    const response = await retryWithBackoff<GenerateContentResponse>(() => 
        ai.models.generateContent({ 
            model: "gemini-3-flash-preview", 
            contents: prompt, 
            config: { tools: [{ googleSearch: {} }] } 
        })
    );
    return JSON.parse(cleanJsonOutput(response.text || "{}"));
  } catch (e) {
    return { title: fallbackTitle, company: fallbackCompany, summary: "", postedDate: new Date().toLocaleDateString() };
  }
};

export const analyzeJob = async (job: Job): Promise<JobAnalysis> => {
  const ai = getClient();
  const safeSummary = (job.summary || "").substring(0, 5000);
  const prompt = `
    Analyze this job for the user based on the System Instructions. 
    Job: ${job.title} at ${job.company}. Summary: ${safeSummary}
    
    ### SCORING & STRATEGY
    - **Score Reasoning**: Provide a bulleted list of why this score was given.
    Return valid JSON matching JobAnalysis interface.
  `;

  // Reasoning task, gemini-3-flash-preview is suitable here.
  const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          scoreReasoning: { type: Type.STRING },
          verdict: { type: Type.STRING },
          strategy: { type: Type.STRING },
          isHighValue: { type: Type.BOOLEAN },
          isCommuteRisk: { type: Type.BOOLEAN },
          workPattern: { type: Type.STRING },
          experienceRequired: { type: Type.STRING },
          salary: { type: Type.STRING },
          industry: { type: Type.STRING },
          matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  }));

  try {
    return JSON.parse(cleanJsonOutput(response.text || "{}"));
  } catch (e) {
    return {
      score: 0, scoreReasoning: "Analysis failed.", verdict: "Analysis failed.", strategy: "Could not parse AI response.",
      isHighValue: false, isCommuteRisk: false, matchedKeywords: []
    };
  }
};

export const generateApplicationKit = async (job: Job, analysis: JobAnalysis): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Create a deep, executive-level "Application Strategy Kit" for the user applying to:
    Role: ${job.title} at ${job.company}.
    
    Job Summary:
    """
    ${job.summary}
    """
    
    Provide sections: Mindset, Trojan Horse, Resume Adjustments, Interview Prep, Cover Letter.
  `;
  // Complex reasoning/coding task, use gemini-3-pro-preview as per guidelines.
  const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({ 
    model: "gemini-3-pro-preview", 
    contents: prompt, 
    config: { systemInstruction: SYSTEM_INSTRUCTION } 
  }));
  return response.text || "Could not generate kit.";
};

export const improveCV = async (currentCv: string, instruction: string): Promise<string> => {
    const ai = getClient();
    const prompt = `
      Rewriter for Senior Designers. 
      Action: ${instruction}
      Current Text: "${currentCv}"
      Return ONLY the rewritten text.
    `;
    // Text refinement task, using gemini-3-flash-preview.
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({ 
        model: "gemini-3-flash-preview", 
        contents: prompt, 
        config: { systemInstruction: "Act as a Senior Resume Writer." }
    }));
    return response.text || currentCv;
};

export const expandJobDescription = async (job: Job): Promise<string> => {
    return job.summary;
};
