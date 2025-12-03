
import React, { useState, useEffect } from 'react';
import { Job } from './types';
import { searchAndParseJobs, analyzeJob, generateApplicationKit } from './services/geminiService';
import { initFirebase, subscribeToJobs, addOrUpdateJob, updateJobStatus, deleteJob, saveAnalysis } from './services/firebase';
import JobCard from './components/JobCard';
import StatsPanel from './components/StatsPanel';
import CoverLetterModal from './components/CoverLetterModal';
import { Zap, RefreshCw, Filter, Database, CloudLightning, Settings, Briefcase, Search } from 'lucide-react';

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

  // Safe check for API Key
  const hasApiKey = (() => {
    let key = '';
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        key = import.meta.env.VITE_API_KEY;
      }
    } catch (e) {}
    
    if (!key) {
        try {
            // @ts-ignore
            if (typeof process !== 'undefined' && process.env) {
                // @ts-ignore
                key = process.env.API_KEY || process.env.VITE_API_KEY;
            }
        } catch (e) {}
    }
    return !!key;
  })();

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
  if (!hasApiKey) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-sm shadow-md border-t-4 border-red-500 max-w-md text-center">
            <h2 className="text-xl font-bold mb-2">API Key Missing</h2>
            <p className="text-gray-600">Please provide a valid Google Gemini API Key in the environment variables.</p>
            <p className="text-xs text-gray-400 mt-4">Required: VITE_API_KEY</p>
        </div>
      </div>
    );
  }

  if (!isDbConnected) {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-sm shadow-xl w-full max-w-2xl border-t-4 border-[#86BC25]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-black text-white rounded-sm">
                        <CloudLightning size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-black uppercase tracking-tight">Connect Cloud Database</h1>
                        <p className="text-gray-500 text-sm">Vyom's Job Agent requires a Firebase Cloud Firestore database to ensure data is never lost across devices.</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                        <h3 className="font-bold text-blue-900 text-sm mb-1 uppercase tracking-wide">How to get this?</h3>
                        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                            <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="underline font-bold">console.firebase.google.com</a> (It's free).</li>
                            <li>Create a Project &rarr; Add Web App &rarr; Copy the <code>firebaseConfig</code> object.</li>
                            <li>Create a <strong>Firestore Database</strong> in "Test Mode".</li>
                            <li>Paste the config object below.</li>
                        </ol>
                    </div>

                    <textarea
                        value={configInput}
                        onChange={(e) => setConfigInput(e.target.value)}
                        placeholder={`{
  apiKey: "AIzaSy...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}`}
                        className="w-full h-64 p-4 font-mono text-xs bg-gray-900 text-green-400 rounded-sm border border-gray-300 focus:ring-2 focus:ring-[#86BC25] focus:outline-none"
                    />
                </div>

                <button
                    onClick={handleConnectDb}
                    className="w-full py-4 bg-black hover:bg-[#86BC25] text-white hover:text-black font-bold uppercase tracking-widest transition-all rounded-sm shadow-lg flex items-center justify-center gap-2"
                >
                    Initialize System <Database size={18} />
                </button>
            </div>
        </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-black p-2 rounded-sm text-white">
                <Zap size={20} fill="currentColor" className="text-[#86BC25]" />
             </div>
             <div>
                <h1 className="text-lg font-extrabold uppercase tracking-tighter leading-none">Vyom's Job Agent</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Cloud Connected</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            {analyzingCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-100 animate-pulse">
                    <RefreshCw size={12} className="animate-spin" />
                    Analyzing {analyzingCount} roles...
                </div>
            )}
            
            <button 
                onClick={fetchJobs}
                disabled={isFetching}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${isFetching ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-[#86BC25] hover:text-black shadow-md'}`}
            >
                <Search size={14} />
                {isFetching ? 'Scouting...' : 'Scout Now'}
            </button>
            
            <button 
                onClick={() => {
                    if(confirm("Disconnect Database?")) {
                        localStorage.removeItem('firebase_config');
                        setIsDbConnected(false);
                    }
                }}
                className="p-2 text-gray-400 hover:text-black transition-colors"
                title="Disconnect DB"
            >
                <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-12 gap-8">
        {/* Left Column: Stats & Filters */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
            <StatsPanel jobs={allJobs} />
            
            <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Filter size={14} /> Filters
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-black uppercase mb-2">Location</label>
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.map(city => (
                                <button
                                    key={city}
                                    onClick={() => setCityFilter(city)}
                                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-sm transition-colors ${cityFilter === city ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-black uppercase mb-2">Sort By</label>
                        <div className="flex bg-gray-100 p-1 rounded-sm">
                             <button 
                                onClick={() => setSortBy('Score')}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${sortBy === 'Score' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                             >
                                Score
                             </button>
                             <button 
                                onClick={() => setSortBy('Date')}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${sortBy === 'Date' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                             >
                                Date
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Job List */}
        <div className="col-span-12 lg:col-span-9">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('new')}
                    className={`px-6 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'new' ? 'border-[#86BC25] text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <Briefcase size={16} />
                    New Opportunities ({allJobs.filter(j => j.status !== 'applied').length})
                </button>
                <button
                    onClick={() => setActiveTab('applied')}
                    className={`px-6 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'applied' ? 'border-[#86BC25] text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-[10px]">
                        {allJobs.filter(j => j.status === 'applied').length}
                    </div>
                    Applied
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {sortedJobs.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Briefcase size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-black uppercase tracking-tight">No Jobs Found</h3>
                        <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or running a new scout.</p>
                    </div>
                ) : (
                    sortedJobs.map(job => (
                        <JobCard 
                            key={job.id} 
                            job={job} 
                            onGenerateKit={handleDraftKit}
                            onToggleStatus={toggleJobStatus}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>
        </div>
      </main>

      {/* Modal */}
      <CoverLetterModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        job={selectedJob}
        content={kitContent}
        isGenerating={isGeneratingKit}
      />
    </div>
  );
};

export default App;
