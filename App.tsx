
import React, { useState, useEffect, useRef } from 'react';
import { Job } from './types';
import { searchAndParseJobs, analyzeJob, generateApplicationKit } from './services/geminiService';
import { initFirebase, isFirebaseConfigured, subscribeToJobs, addOrUpdateJob, updateJobStatus, deleteJob, saveAnalysis } from './services/firebase';
import { FirebaseConfig } from './constants';
import JobCard from './components/JobCard';
import StatsPanel from './components/StatsPanel';
import CoverLetterModal from './components/CoverLetterModal';
import { Zap, AlertCircle, RefreshCw, Filter, Database, CloudLightning, Download, Upload, Settings } from 'lucide-react';
import { USER_PROFILE } from './constants';

const App: React.FC = () => {
  // Navigation & Data
  const [activeTab, setActiveTab] = useState<'new' | 'applied'>('new');
  const [allJobs, setAllJobs] = useState<Job[]>([]); // Data comes from Firestore now
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [configInput, setConfigInput] = useState('');

  // Filter & Sort
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'Score' | 'Date'>('Score');

  // Status
  const [isFetching, setIsFetching] = useState(false);
  const [analyzingCount, setAnalyzingCount] = useState(0);
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [kitContent, setKitContent] = useState("");
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);

  const hasApiKey = !!process.env.API_KEY;

  // --- 1. DB INITIALIZATION ---
  useEffect(() => {
    // Check if we have saved firebase config in LS (Config keys can live in LS, Data lives in Cloud)
    const savedConfig = localStorage.getItem('firebase_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        const success = initFirebase(config);
        setIsDbConnected(success);
      } catch (e) {
        console.error("Invalid saved config", e);
      }
    }
  }, []);

  // --- 2. REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    if (isDbConnected) {
      const unsubscribe = subscribeToJobs((jobs) => {
        setAllJobs(jobs);
      });
      return () => unsubscribe();
    }
  }, [isDbConnected]);

  const handleConnectDb = () => {
    try {
      // Allow user to paste raw JSON or just the object content
      const cleanInput = configInput.replace(/const firebaseConfig = /, '').replace(/;$/, '');
      const config = JSON.parse(cleanInput);
      
      const success = initFirebase(config);
      if (success) {
        localStorage.setItem('firebase_config', JSON.stringify(config));
        setIsDbConnected(true);
      } else {
        alert("Failed to initialize Firebase. Check config.");
      }
    } catch (e) {
      alert("Invalid JSON Format. Please paste the full firebaseConfig object.");
    }
  };

  const fetchJobs = async () => {
    if (!isDbConnected) return;
    setIsFetching(true);
    
    // RELAXED QUERY for broad discovery
    const query = `("Product Designer" OR "UX Designer" OR "UI Designer" OR "Visual Designer" OR "Interaction Designer" OR "Service Designer" OR "UX Researcher" OR "Product Design Lead") "United Kingdom" -Intern -Trainee -Apprentice (site:linkedin.com/jobs OR site:reed.co.uk OR site:glassdoor.co.uk OR site:totaljobs.com OR site:otta.com OR site:civilservicejobs.service.gov.uk OR site:ifyoucouldjobs.com OR site:designweek.co.uk OR site:cwjobs.co.uk OR site:adzuna.co.uk)`;
    
    try {
      // 1. Fetch Jobs from AI
      const foundJobs = await searchAndParseJobs(query);
      
      // 2. Push directly to Firestore (Deduplication happens on the backend via ID)
      const jobsToAnalyze: Job[] = [];
      
      for (const job of foundJobs) {
        // We need to check if this job already exists and has analysis
        // Since we don't want to re-analyze existing jobs, we check our local 'allJobs' snapshot
        const docId = `${job.title}_${job.company}`.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 100);
        const existing = allJobs.find(j => j.id === docId); // Note: Firebase service sets ID to this format
        
        // Save to DB
        await addOrUpdateJob(job);

        // Queue for analysis if it's new OR if it doesn't have analysis yet
        if (!existing || !existing.analysis) {
           jobsToAnalyze.push({ ...job, id: docId });
        }
      }
      
      setIsFetching(false);
      
      // 3. Trigger Analysis (Async)
      if (jobsToAnalyze.length > 0) {
        analyzeNewJobs(jobsToAnalyze);
      } else {
        console.log("No new un-analyzed jobs found.");
      }

    } catch (error) {
      console.error(error);
      setIsFetching(false);
    }
  };

  const analyzeNewJobs = async (jobs: Job[]) => {
      setAnalyzingCount(prev => prev + jobs.length);
      let errorCount = 0;

      for (const job of jobs) {
        if (errorCount >= 3) break;

        try {
            const analysis = await analyzeJob(job);
            // Save analysis to Cloud
            await saveAnalysis(job.id, analysis);
            errorCount = 0; 
        } catch (e) {
            console.error(`Analysis failed for job ${job.id}`, e);
            errorCount++;
        } finally {
            setAnalyzingCount(prev => Math.max(0, prev - 1));
            // 4s delay for Free Tier safety
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
      }
      setAnalyzingCount(0);
  };

  const handleDraftKit = async (job: Job) => {
    if (!job.analysis) return;
    setSelectedJob(job);
    setModalOpen(true);
    setKitContent("");
    setIsGeneratingKit(true);
    const content = await generateApplicationKit(job, job.analysis);
    setKitContent(content);
    setIsGeneratingKit(false);
  };

  const toggleJobStatus = (jobId: string, currentStatus: 'new' | 'applied') => {
    const newStatus = currentStatus === 'new' ? 'applied' : 'new';
    updateJobStatus(jobId, newStatus);
  };

  const handleDelete = (jobId: string) => {
    if(confirm("Remove this job from Cloud Database?")) {
        deleteJob(jobId);
    }
  };

  // --- Dynamic Locations for Filters ---
  const availableLocations = Array.from(new Set(allJobs.map(j => {
    const loc = j.location.toLowerCase();
    if (loc.includes('edinburgh')) return 'Edinburgh';
    if (loc.includes('glasgow')) return 'Glasgow';
    if (loc.includes('remote')) return 'Remote';
    if (loc.includes('london')) return 'London';
    if (loc.includes('manchester')) return 'Manchester';
    return 'Other';
  }))).sort((a: string, b: string) => {
      const priority = ['Edinburgh', 'Glasgow', 'Remote', 'London'];
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
  });
  
  const filterOptions = ['All', ...availableLocations];

  const filteredJobs = allJobs.filter(j => {
    if (j.status !== activeTab) return false;
    if (cityFilter !== 'All') {
        const loc = j.location.toLowerCase();
        if (cityFilter === 'Other') {
            const standard = ['edinburgh', 'glasgow', 'remote', 'london', 'manchester'];
            return !standard.some(s => loc.includes(s));
        }
        return loc.includes(cityFilter.toLowerCase());
    }
    return true;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'Score') {
        const scoreA = a.analysis?.score || 0;
        const scoreB = b.analysis?.score || 0;
        return scoreB - scoreA;
    } else {
        const dateA = a.postedDate || "";
        const dateB = b.postedDate || "";
        const weightA = dateA.match(/hour|Just|Today/i) ? 2 : 1;
        const weightB = dateB.match(/hour|Just|Today/i) ? 2 : 1;
        return weightB - weightA; 
    }
  });

  // --- CONFIG SCREEN (If no DB) ---