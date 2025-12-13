
import { initializeApp, FirebaseApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc, getDoc, Firestore } from "firebase/firestore";
import { Job } from "../types";
import { FirebaseConfig } from "../constants";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const initFirebase = (config: FirebaseConfig) => {
  try {
    if (!config.projectId) {
      console.error("Firebase Config missing 'projectId'.");
      return false;
    }
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    if (app) {
      db = getFirestore(app);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    return false;
  }
};

export const isFirebaseConfigured = () => !!db;

const getDocId = (job: Job) => {
  const raw = `${job.title}_${job.company}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return raw.substring(0, 100); 
};

export const subscribeToJobs = (onData: (jobs: Job[]) => void) => {
  if (!db) return () => {};
  try {
    const colRef = collection(db, "jobs");
    return onSnapshot(colRef, (snapshot) => {
      const jobs: Job[] = [];
      snapshot.forEach((doc) => {
        jobs.push(doc.data() as Job);
      });
      onData(jobs);
    }, (error) => {
      console.error("Firestore subscription error:", error);
    });
  } catch (e) {
    console.error("Failed to subscribe to jobs:", e);
    return () => {};
  }
};

export const addOrUpdateJob = async (job: Job) => {
  if (!db) return;
  try {
    const docId = job.id.startsWith('manual') ? job.id : getDocId(job);
    const docRef = doc(db, "jobs", docId);
    const jobWithId = { ...job, id: docId };
    await setDoc(docRef, jobWithId, { merge: true });
  } catch (e) {
    console.error("Error adding job:", e);
  }
};

export const addManualJob = async (url: string) => {
    if (!db) return;
    try {
        let source = "Web";
        let domain = "";
        let placeholderTitle = "Job Posting";
        let placeholderCompany = "Detecting...";
        let idFound = "";

        try {
            const urlObj = new URL(url);
            domain = urlObj.hostname.replace('www.', '');
            const hostParts = domain.split('.');
            if (hostParts.length > 1) {
                source = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
            }
            if (domain.includes('oraclecloud') || domain.includes('jpmc')) {
                placeholderCompany = "JPMorgan Chase";
            } else if (domain.includes('linkedin')) {
                placeholderCompany = "LinkedIn Job";
            } else {
                placeholderCompany = source;
            }

            // Extract Job ID for title if possible
            const idMatch = url.match(/\/job\/(\d+)/) || url.match(/jobId=(\d+)/) || url.match(/currentJobId=(\d+)/) || url.match(/\/(\d{6,})/);
            if (idMatch) {
                idFound = idMatch[1];
                placeholderTitle = `Job ${idFound}`;
            } else {
                // Try slug
                 const pathParts = urlObj.pathname.split(/[-/_]/).filter(p => p.length > 2);
                 if (pathParts.length > 0) {
                     const meaningful = pathParts.filter(p => !['job', 'view', 'linkedin', 'careers', 'detail', 'uk', 'en', 'sites'].includes(p.toLowerCase()));
                     if (meaningful.length > 0) {
                         placeholderTitle = meaningful.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                     }
                 }
            }

        } catch (e) {}

        const job: Job = {
            id: `manual-${Date.now()}`,
            title: placeholderTitle,
            company: placeholderCompany,
            location: "Unknown",
            url: url,
            summary: "", // Clean summary
            source: source,
            status: "saved",
            postedDate: new Date().toLocaleDateString(),
            scoutedAt: Date.now()
        };
        await addOrUpdateJob(job);
        return job;
    } catch (e) {
        console.error("Error adding manual job", e);
    }
};

export const updateJobStatus = async (jobId: string, status: Job['status']) => {
  if (!db) return;
  try {
    const docRef = doc(db, "jobs", jobId);
    const updateData: any = { status };
    if (status === 'applied') {
        updateData.appliedDate = new Date().toLocaleDateString();
    }
    await updateDoc(docRef, updateData);
  } catch (e) {
    console.error("Error updating status:", e);
  }
};

export const saveAnalysis = async (jobId: string, analysis: any) => {
  if (!db) return;
  try {
    const docRef = doc(db, "jobs", jobId);
    await updateDoc(docRef, { analysis });
  } catch (e) {
    console.error("Error saving analysis:", e);
  }
};

export const deleteJob = async (jobId: string) => {
  if (!db) return;
  try {
    const docRef = doc(db, "jobs", jobId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error("Error deleting job:", e);
  }
};

// CV PERSISTENCE
export const saveCV = async (content: string) => {
    if (!db) return;
    try {
        const docRef = doc(db, "user_data", "cv_main");
        await setDoc(docRef, { content, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
        console.error("Error saving CV:", e);
    }
};

export const getCV = async () => {
    if (!db) return "";
    try {
        const docRef = doc(db, "user_data", "cv_main");
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data().content || "";
        }
    } catch (e) {
        console.error("Error fetching CV:", e);
    }
    return "";
};
