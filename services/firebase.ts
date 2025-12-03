
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc, Firestore } from "firebase/firestore";
import { Job } from "../types";
import { FirebaseConfig } from "../constants";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const initFirebase = (config: FirebaseConfig) => {
  if (!app) {
    app = initializeApp(config);
    db = getFirestore(app);
  }
  return !!db;
};

export const isFirebaseConfigured = () => !!db;

// Sanitize string for Doc ID
const getDocId = (job: Job) => {
  // Create a deterministic ID based on Title + Company to prevent duplicates
  // e.g. "seniorux_google"
  const raw = `${job.title}_${job.company}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return raw.substring(0, 100); // Firestore max ID length
};

export const subscribeToJobs = (onData: (jobs: Job[]) => void) => {
  if (!db) return () => {};
  
  const colRef = collection(db, "jobs");
  // Real-time listener
  return onSnapshot(colRef, (snapshot) => {
    const jobs: Job[] = [];
    snapshot.forEach((doc) => {
      jobs.push(doc.data() as Job);
    });
    // Sort logic handled in UI, just return raw data
    onData(jobs);
  });
};

export const addOrUpdateJob = async (job: Job) => {
  if (!db) return;
  const docId = getDocId(job);
  const docRef = doc(db, "jobs", docId);
  
  // Use merge: true so we don't overwrite existing analysis if we just re-scouted the basic info
  // However, for new jobs, we want to set the ID to match our deterministic one
  const jobWithId = { ...job, id: docId };
  
  await setDoc(docRef, jobWithId, { merge: true });
};

export const updateJobStatus = async (jobId: string, status: 'new' | 'applied') => {
  if (!db) return;
  const docRef = doc(db, "jobs", jobId);
  await updateDoc(docRef, { 
    status,
    appliedDate: status === 'applied' ? new Date().toLocaleDateString() : null 
  });
};

export const saveAnalysis = async (jobId: string, analysis: any) => {
  if (!db) return;
  const docRef = doc(db, "jobs", jobId);
  await updateDoc(docRef, { analysis });
};

export const deleteJob = async (jobId: string) => {
  if (!db) return;
  const docRef = doc(db, "jobs", jobId);
  await deleteDoc(docRef);
};
