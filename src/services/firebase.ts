import { initializeApp, FirebaseApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc, Firestore } from "firebase/firestore";
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
    const docId = getDocId(job);
    const docRef = doc(db, "jobs", docId);
    const jobWithId = { ...job, id: docId };
    await setDoc(docRef, jobWithId, { merge: true });
  } catch (e) {
    console.error("Error adding job:", e);
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