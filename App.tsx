import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Job, ViewState } from './types';
import { searchAndParseJobs, analyzeJob, generateApplicationKit, enrichJob } from './services/geminiService';
import { initFirebase, subscribeToJobs, addOrUpdateJob, updateJobStatus, deleteJob, saveAnalysis, addManualJob } from './services/firebase';
import { DEFAULT_FIREBASE_CONFIG } from './constants';
import JobCard from './components/JobCard';
import StatsPanel from './components/StatsPanel';
import KanbanBoard from './components/KanbanBoard';
import CVEditor from './components/CVEditor';
import JobDetailModal from './components/JobDetailModal';
import AddLinkModal from './components/AddLinkModal';
import { Layers, Moon, Sun, LogOut, Settings, X, Archive, Trash2, Plus, Search, ArrowDownUp, Sparkles, Radar, Filter, MapPin, Zap, Monitor, Briefcase, FileText, Home } from 'lucide-react';

const App: React.FC = () => {
  // Navigation & Data
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [activeTab, setActiveTab] = useState<'new' | 'saved' | 'archived'>('new');
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [targetJobId, setTargetJobId] = useState<string | null>(null);
  
  // Search Configuration
  const [searchRole, setSearchRole] = useState('Senior UX Designer');
  const [searchLocation, setSearchLocation] = useState('United Kingdom');
  const [isSearchSettingsOpen, setIsSearchSettingsOpen] = useState(false);
  const searchSettingsRef = useRef<HTMLDivElement>(null);

  // Filter Configuration (Dropdowns)
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationMenuRef = useRef<HTMLDivElement>(null);

  // VISUAL TELEMETRY (Scouting Drone)
  const [scoutState, setScoutState] = useState<'idle' | 'initializing' | 'scanning' | 'analyzing' | 'complete'>('idle');
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);

  // Multi-Select
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || 
               (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Profile Menu State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Auto-Init Firebase
  const [isDbConnected] = useState(() => initFirebase(DEFAULT_FIREBASE_CONFIG));
  
  // Filter & Sort
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [specialFilter, setSpecialFilter] = useState<'none' | 'high_value' | 'remote'>('none');

  // Status
  const [analyzingCount, setAnalyzingCount] = useState(0);
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [initialModalTab, setInitialModalTab] = useState<'brief' | 'strategy'>( 'brief');
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);

  // Theme Effect
  useEffect(() => {
      if (darkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  }, [darkMode]);

  // Click Outside Profile/Search/Location Menu
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
              setIsProfileMenuOpen(false);
          }
          if (searchSettingsRef.current && !searchSettingsRef.current.contains(event.target as Node)) {
              setIsSearchSettingsOpen(false);
          }
          if (locationMenuRef.current && !locationMenuRef.current.contains(event.target as Node)) {
              setIsLocationOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDbConnected) {
      const unsubscribe = subscribeToJobs((jobs) => {
        setAllJobs(jobs);
      });
      return () => unsubscribe();
    }
  }, [isDbConnected]);

  const addTelemetry = (log: string) => {
      setTelemetryLogs(prev => [...prev.slice(-5), `> ${log}`]);
  };

  const fetchJobs = async () => {
    if (!isDbConnected) return;
    setScoutState('initializing');
    setTelemetryLogs([]);
    addTelemetry(`System Initialized. User: Vyom Pathroliya`);
    await new Promise(r => setTimeout(r, 600));
    
    addTelemetry(`Target Protocol: ${searchRole}`);
    addTelemetry(`Geo-Fence: ${searchLocation}`);
    setScoutState('scanning');
    
    try {
      addTelemetry(`Triangulating salary bands...`);
      const foundJobs = await searchAndParseJobs(searchRole, searchLocation);
      addTelemetry(`Filtering low-seniority noise...`);
      
      const jobsToAnalyze: Job[] = [];
      for (const job of foundJobs) {
        const docId = `${job.title}_${job.company}`.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 100);
        const existing = allJobs.find(j => j.id === docId);
        const jobWithTimestamp = { ...job, scoutedAt: Date.now() };
        await addOrUpdateJob(jobWithTimestamp);
        if (!existing || !existing.analysis) {
           jobsToAnalyze.push({ ...jobWithTimestamp, id: docId });
        }
      }

      if (jobsToAnalyze.length > 0) {
          setScoutState('analyzing');
          addTelemetry(`Cross-referencing Fintech keywords...`);
          addTelemetry(`Analyzing commute risk factors...`);
          await analyzeNewJobs(jobsToAnalyze);
      } else {
          addTelemetry(`No new un-analyzed targets.`);
      }
      
      addTelemetry(`Mission Complete.`);
      await new Promise(r => setTimeout(r, 800));
      setScoutState('idle');

    } catch (error) { 
        console.error(error); 
        addTelemetry(`ERR: Signal Lost.`);
        setTimeout(() => setScoutState('idle'), 2000);
    }
  };

  const analyzeNewJobs = async (jobs: Job[]) => {
      setAnalyzingCount(prev => prev + jobs.length);
      for (const job of jobs) {
        try {
            addTelemetry(`Analyzing fit: ${job.company}...`);
            const analysis = await analyzeJob(job);
            await saveAnalysis(job.id, analysis);
        } catch (e) {
            console.error(`Analysis failed for job ${job.id}`, e);
        } finally {
            setAnalyzingCount(prev => Math.max(0, prev - 1));
            // Artificial delay to make the telemetry readable (Game Design)
            await new Promise(resolve => setTimeout(resolve, 600)); 
        }
      }
      setAnalyzingCount(0);
  };

  const handleOpenDetail = (job: Job, tab: 'brief' | 'strategy' = 'brief') => {
    setSelectedJob(job);
    setInitialModalTab(tab);
    setModalOpen(true);
  };

  const handleUpdateJob = async (updatedJob: Job) => {
      await addOrUpdateJob(updatedJob);
      if (selectedJob && selectedJob.id === updatedJob.id) {
          setSelectedJob(updatedJob);
      }
  };

  const handleReAnalyzeJob = async (job: Job) => {
      try {
          const analysis = await analyzeJob(job);
          await saveAnalysis(job.id, analysis);
          const updatedJob = { ...job, analysis };
          setSelectedJob(updatedJob);
          setAllJobs(prev => prev.map(j => j.id === job.id ? updatedJob : j));
      } catch (e) {
          console.error("Re-analysis failed", e);
      }
  };

  const handleGenerateKit = async (job: Job) => {
    if (!job.analysis) return;
    const content = await generateApplicationKit(job, job.analysis);
    const updatedAnalysis = { ...job.analysis, strategy: content };
    await saveAnalysis(job.id, updatedAnalysis);
  };

  const toggleJobStatus = (jobId: string, currentStatus: Job['status']) => {
    let newStatus: Job['status'] = 'saved';
    if (currentStatus === 'new') newStatus = 'saved';
    else if (currentStatus === 'saved') newStatus = 'new'; 
    else if (currentStatus === 'archived') newStatus = 'new';
    updateJobStatus(jobId, newStatus!);
  };

  const handleDelete = (jobId: string) => {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    if (job.status === 'archived') {
        if(confirm("Permanently delete?")) deleteJob(jobId);
    } else {
        updateJobStatus(jobId, 'archived');
    }
  };

  const handleBulkArchive = async () => {
      for (const id of selectedJobIds) {
          await updateJobStatus(id, 'archived');
      }
      setSelectedJobIds(new Set());
      setIsSelectMode(false);
  };

  const handleBulkDelete = async () => {
      if (!confirm(`Delete ${selectedJobIds.size} jobs permanently?`)) return;
      for (const id of selectedJobIds) {
          await deleteJob(id);
      }
      setSelectedJobIds(new Set());
      setIsSelectMode(false);
  };

  const toggleJobSelection = (id: string) => {
      const next = new Set(selectedJobIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedJobIds(next);
  };

  const handleAddManualJob = async (data: { url?: string, text?: string, title?: string, company?: string }) => {
      try {
          if (currentView !== ViewState.DASHBOARD && currentView !== ViewState.KANBAN) {
              setCurrentView(ViewState.DASHBOARD);
              setActiveTab('saved');
          }
          const placeholder = await addManualJob(data);
          if (!placeholder) return;
          setSelectedJob(placeholder);
          setModalOpen(true);
          setInitialModalTab('brief');
          setAnalyzingCount(prev => prev + 1);
          const enrichedDetails = await enrichJob(data);
          const enrichedJob = { ...placeholder, ...enrichedDetails };
          await addOrUpdateJob(enrichedJob);
          setSelectedJob(prev => (prev && prev.id === placeholder.id ? enrichedJob : prev));
          const analysis = await analyzeJob(enrichedJob);
          await saveAnalysis(enrichedJob.id, analysis);
          const analyzedJob = { ...enrichedJob, analysis };
          setSelectedJob(prev => (prev && prev.id === placeholder.id ? analyzedJob : prev));
      } catch (e) {
          console.error("Error adding manual job", e);
      } finally {
          setAnalyzingCount(prev => Math.max(0, prev - 1));
      }
  };

  const handleTailorResume = (jobId: string) => {
    setTargetJobId(jobId);
    setModalOpen(false);
    setCurrentView(ViewState.CV_EDITOR);
  };

  const jobsInCurrentTab = useMemo(() => {
    return allJobs.filter(j => {
        const status = j.status || 'new';
        if (activeTab === 'new') return status === 'new';
        if (activeTab === 'saved') return ['saved', 'applied', 'assessment', 'interview', 'offer'].includes(status);
        if (activeTab === 'archived') return status === 'archived';
        return false;
    });
  }, [allJobs, activeTab]);

  const filteredJobs = useMemo(() => {
      return jobsInCurrentTab.filter(j => {
        // City Filter
        const locMatch = cityFilter === 'All' ? true : (cityFilter === 'Other' ? !['edinburgh', 'glasgow', 'remote', 'london', 'manchester'].some(s => j.location.toLowerCase().includes(s)) : j.location.toLowerCase().includes(cityFilter.toLowerCase()));
        if (!locMatch) return false;
        
        // Industry Filter
        if (industryFilter) {
            const ind = j.analysis?.industry || 'Tech';
            if (ind !== industryFilter) return false;
        }

        // Special Smart Filters
        if (specialFilter === 'high_value') {
            if ((j.analysis?.score || 0) < 80) return false;
        }
        if (specialFilter === 'remote') {
            const text = (j.location + " " + j.summary + " " + (j.analysis?.workPattern || "")).toLowerCase();
            if (!text.includes('remote') && !text.includes('home') && !text.includes('wfh')) return false;
        }

        return true;
      }).sort((a, b) => {
          if (sortBy === 'score') return (b.analysis?.score || 0) - (a.analysis?.score || 0);
          return (b.scoutedAt || 0) - (a.scoutedAt || 0);
      });
  }, [jobsInCurrentTab, cityFilter, industryFilter, sortBy, specialFilter]);

  const filterOptions = ['All', 'Edinburgh', 'Glasgow', 'Remote', 'London', 'Other'];

  const targetJobForEditor = useMemo(() => {
      if (!targetJobId) return null;
      return allJobs.find(j => j.id === targetJobId) || null;
  }, [targetJobId, allJobs]);

  const isFixedLayout = currentView === ViewState.KANBAN || currentView === ViewState.CV_EDITOR;

  return (
    <div className={`bg-[#F5F5F7] dark:bg-black font-sans transition-colors duration-300 ${isFixedLayout ? 'h-screen overflow-hidden flex flex-col' : 'min-h-screen pb-24 overflow-x-hidden'}`}>
        
        {/* SCOUTING DRONE OVERLAY */}
        {scoutState !== 'idle' && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="w-[480px] bg-[#1C1C1E] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative ring-1 ring-white/10">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0071e3] to-transparent animate-shimmer"></div>
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                                <Radar className="text-[#0071e3] animate-spin-slow" size={40} />
                                <div className="absolute inset-0 bg-[#0071e3]/30 rounded-full blur-xl animate-pulse"></div>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xl tracking-tight">Scout Drone Active</h3>
                                <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-1">Sector: {searchLocation}</p>
                            </div>
                        </div>
                        <div className="h-40 font-mono text-xs text-[#00ff00] bg-black rounded-xl p-4 overflow-hidden flex flex-col justify-end shadow-inner mb-6 border border-white/10">
                            {telemetryLogs.map((log, i) => (
                                <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap overflow-hidden text-ellipsis opacity-80">
                                    {log}
                                </div>
                            ))}
                            <div className="w-2 h-4 bg-[#00ff00] animate-pulse inline-block ml-1"></div>
                        </div>
                        <div className="flex items-center justify-between text-gray-500 text-[10px] uppercase tracking-[0.2em]">
                             <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${scoutState === 'analyzing' ? 'bg-yellow-500 animate-pulse' : 'bg-[#0071e3]'}`}></span>
                                {scoutState} Protocol
                             </span>
                             <span>SECURE CONN</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl z-[40] border-b border-black/5 dark:border-white/5 transition-colors duration-300">
            <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between px-6">
                 <div className="flex items-center gap-8">
                     <span className="font-bold text-lg tracking-tight text-[#1d1d1f] dark:text-white flex items-center gap-2"><Layers size={20} className="text-[#0071e3]" /> Career Studio</span>
                     <div className="hidden sm:flex items-center gap-1 bg-gray-100/50 dark:bg-white/5 p-1 rounded-lg">
                         <button onClick={() => { setCurrentView(ViewState.DASHBOARD); setTargetJobId(null); }} className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none ${currentView === ViewState.DASHBOARD ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}>Discover</button>
                         <button onClick={() => { setCurrentView(ViewState.KANBAN); setTargetJobId(null); }} className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none ${currentView === ViewState.KANBAN ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}>Pipeline</button>
                         <button onClick={() => setCurrentView(ViewState.CV_EDITOR)} className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none ${currentView === ViewState.CV_EDITOR ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}>Resume</button>
                     </div>
                 </div>
                 <div className="flex items-center gap-4">
                     {analyzingCount > 0 && (
                        <span className="flex items-center gap-2 text-[#0071e3] dark:text-[#0A84FF] font-medium text-[12px] bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full"><Sparkles size={12} className="animate-spin" /> Analyzing Targets...</span>
                     )}
                     <div className="relative" ref={profileMenuRef}>
                        <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} aria-label="Profile Menu" className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] text-white flex items-center justify-center text-[10px] font-bold shadow-md hover:scale-105 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0071e3] ring-offset-white dark:ring-offset-black">VP</button>
                        {isProfileMenuOpen && (
                            <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                                <div className="px-5 py-4 border-b border-[#f5f5f7] dark:border-[#38383A] bg-gray-50/50 dark:bg-white/5">
                                    <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">Vyom Pathroliya</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Senior UX Designer</p>
                                </div>
                                <div className="p-2 space-y-1">
                                    <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] rounded-xl transition-colors group">
                                        <div className="flex items-center gap-3"><span className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-md group-hover:bg-white dark:group-hover:bg-black transition-colors">{darkMode ? <Moon size={14} /> : <Sun size={14} />}</span><span>Dark Mode</span></div>
                                        <div className={`w-9 h-5 rounded-full relative transition-colors ${darkMode ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'}`}><div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#FF3B30] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] rounded-xl transition-colors group">
                                        <span className="p-1.5 bg-[#FF3B30]/10 rounded-md group-hover:bg-[#FF3B30]/20 transition-colors"><LogOut size={14} /></span> Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                     </div>
                 </div>
            </div>
        </nav>

        <main className={`${isFixedLayout ? 'h-full pt-16 flex flex-col pb-16 sm:pb-0' : 'pt-24'}`}>
            <div key={currentView} className={`view-enter ${isFixedLayout ? 'h-full flex flex-col' : ''}`}>
                
                {currentView === ViewState.DASHBOARD && (
                    <div className="max-w-[1440px] mx-auto px-6">
                        {/* HERO SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 items-stretch h-auto md:h-[280px]">
                            {/* Text Hero */}
                            <div className="md:col-span-8 flex flex-col justify-end pb-4 animate-fade-in-up relative z-40">
                                <h1 className="text-[48px] md:text-[64px] leading-[1.05] font-bold text-[#1d1d1f] dark:text-white tracking-tighter mb-5 transition-colors">
                                    Navigate your <br/><span className="text-gray-500 dark:text-gray-400">next breakthrough.</span>
                                </h1>
                                <div className="flex flex-wrap items-center gap-4">
                                     <div className="relative z-50" ref={searchSettingsRef}>
                                        <button onClick={() => setIsSearchSettingsOpen(!isSearchSettingsOpen)} aria-label="Search Settings" className="h-12 px-5 rounded-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-[#1d1d1f] dark:text-white transition-all hover:scale-105 active:scale-95 shadow-sm flex items-center gap-2 text-sm font-bold focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none"><Settings size={18} /> Scout Config</button>
                                        {isSearchSettingsOpen && (
                                            <div className="absolute top-full left-0 mt-3 w-80 bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-black/5 dark:border-white/10 p-6 z-[60] animate-in fade-in zoom-in-95 duration-200">
                                                <div className="flex items-center justify-between mb-6"><h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Search Parameters</h4><button onClick={() => setIsSearchSettingsOpen(false)} aria-label="Close Settings" className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={16} /></button></div>
                                                <div className="space-y-5">
                                                    <div><label className="block text-[11px] font-bold text-[#1d1d1f] dark:text-white mb-2">Target Role</label><input value={searchRole} onChange={e => setSearchRole(e.target.value)} className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-[#0071e3]" /></div>
                                                    <div><label className="block text-[11px] font-bold text-[#1d1d1f] dark:text-white mb-2">Geo-Fence</label><input value={searchLocation} onChange={e => setSearchLocation(e.target.value)} className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-[#0071e3]" /></div>
                                                </div>
                                            </div>
                                        )}
                                     </div>
                                     <button onClick={fetchJobs} disabled={scoutState !== 'idle'} className={`h-12 px-8 rounded-full bg-[#1d1d1f] dark:bg-white hover:bg-black dark:hover:bg-[#E5E5EA] text-white dark:text-black text-[15px] font-bold transition-all flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1d1d1f] focus:outline-none ${scoutState !== 'idle' ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/5'}`}><Search size={18} /> {scoutState !== 'idle' ? 'Scouting...' : 'Run Scout'}</button>
                                     <button onClick={() => setIsAddLinkOpen(true)} aria-label="Add Job" className="h-12 w-12 flex items-center justify-center rounded-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-[#1d1d1f] dark:text-white transition-all hover:scale-105 active:scale-95 shadow-sm focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none"><Plus size={20} /></button>
                                </div>
                            </div>
                            {/* Stats Widget */}
                            <div className="md:col-span-4 h-full hidden md:block pl-4 animate-fade-in-up">
                                <StatsPanel jobs={jobsInCurrentTab} selectedIndustry={industryFilter} onSelectIndustry={setIndustryFilter}/>
                            </div>
                        </div>

                        {/* CONTROL DECK */}
                        <div className="sticky top-[64px] z-30 -mx-6 px-6 py-5 bg-[#F5F5F7]/95 dark:bg-black/90 backdrop-blur-xl border-y border-black/5 dark:border-white/10 flex items-center justify-between gap-4 mb-8 shadow-sm transition-colors">
                            <div className="flex items-center gap-3 shrink-0">
                                {/* Tab Switcher */}
                                <div className="flex p-1 bg-gray-200/50 dark:bg-white/10 rounded-lg mr-2">
                                    {['new', 'saved', 'archived'].map((tab) => (
                                        <button key={tab} onClick={() => { setActiveTab(tab as any); setIsSelectMode(false); setSelectedJobIds(new Set()); }} className={`px-4 py-1.5 rounded-md text-[13px] font-bold capitalize transition-all focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none ${activeTab === tab ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}>
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1"></div>
                                {/* Location Dropdown */}
                                <div className="relative z-50" ref={locationMenuRef}>
                                     <button onClick={() => setIsLocationOpen(!isLocationOpen)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none ${cityFilter !== 'All' ? 'bg-[#0071e3] text-white border-transparent' : 'bg-white dark:bg-[#1C1C1E] border-black/5 dark:border-white/10 text-[#1d1d1f] dark:text-white hover:border-black/20'}`}>
                                        <MapPin size={12} /> {cityFilter === 'All' ? 'All Locations' : cityFilter}
                                     </button>
                                     {isLocationOpen && (
                                         <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#1C1C1E] rounded-xl shadow-xl border border-black/5 dark:border-white/10 p-1 animate-in fade-in zoom-in-95 duration-100 origin-top-left z-[60]">
                                             {filterOptions.map(city => (
                                                 <button 
                                                    key={city} 
                                                    onClick={() => { setCityFilter(city); setIsLocationOpen(false); }} 
                                                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#1d1d1f] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                                 >
                                                     {city}
                                                 </button>
                                             ))}
                                         </div>
                                     )}
                                </div>
                            </div>

                            {/* Scrolling Pills */}
                            <div className="flex-1 overflow-x-auto no-scrollbar mask-linear-fade px-2">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSpecialFilter(specialFilter === 'high_value' ? 'none' : 'high_value')} className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none ${specialFilter === 'high_value' ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-black border-transparent' : 'bg-white dark:bg-[#1C1C1E] border-black/5 dark:border-white/10 text-[#1d1d1f] dark:text-white hover:border-black/20'}`}>
                                        <Zap size={12} className={specialFilter === 'high_value' ? 'fill-current' : ''} /> High Value
                                    </button>
                                    <button onClick={() => setSpecialFilter(specialFilter === 'remote' ? 'none' : 'remote')} className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none ${specialFilter === 'remote' ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-black border-transparent' : 'bg-white dark:bg-[#1C1C1E] border-black/5 dark:border-white/10 text-[#1d1d1f] dark:text-white hover:border-black/20'}`}>
                                        <Monitor size={12} /> Remote
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {jobsInCurrentTab.length > 0 && (
                                    <button onClick={() => { setIsSelectMode(!isSelectMode); setSelectedJobIds(new Set()); }} className={`text-[11px] font-bold px-4 py-1.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none ${isSelectMode ? 'bg-[#0071e3] text-white' : 'bg-transparent text-[#0071e3] hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>
                                        {isSelectMode ? 'Done Selecting' : 'Select Jobs'}
                                    </button>
                                )}
                                <div className="w-px h-6 bg-gray-300 dark:bg-white/10"></div>
                                <button onClick={() => setSortBy(sortBy === 'date' ? 'score' : 'date')} className="text-[11px] font-bold text-gray-500 hover:text-[#0071e3] flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none">
                                    <ArrowDownUp size={14}/> {sortBy === 'date' ? 'Newest' : 'Top Score'}
                                </button>
                                <button onClick={() => {setSpecialFilter('none'); setCityFilter('All'); setIndustryFilter(null); setSortBy('date');}} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none" aria-label="Clear Filters" title="Clear Filters">
                                    <Filter size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Bulk Action Bar */}
                        {isSelectMode && selectedJobIds.size > 0 && (
                            <div className="mb-8 p-4 bg-[#1d1d1f] dark:bg-white rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300 text-white dark:text-black mx-auto max-w-2xl sticky top-32 z-40 ring-1 ring-white/20">
                                <span className="text-sm font-bold pl-2">{selectedJobIds.size} selected</span>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleBulkArchive} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 dark:bg-black/10 rounded-full text-xs font-bold hover:bg-white/20 dark:hover:bg-black/20 transition-colors"><Archive size={14}/> Archive</button>
                                    <button onClick={handleBulkDelete} className="flex items-center gap-2 px-5 py-2.5 bg-[#FF3B30] text-white rounded-full text-xs font-bold hover:bg-[#D70015] transition-colors"><Trash2 size={14}/> Delete</button>
                                </div>
                            </div>
                        )}

                        {/* GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                            {filteredJobs.length === 0 ? (
                                <div className="col-span-full py-32 text-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#1C1C1E] rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600"><Search size={24}/></div>
                                    <p className="text-sm font-bold text-gray-500">No opportunities found in this view.</p>
                                    <button onClick={() => {setSpecialFilter('none'); setCityFilter('All'); setIndustryFilter(null);}} className="mt-4 text-xs font-bold text-[#0071e3] hover:underline focus-visible:ring-2 focus-visible:ring-[#0071e3] focus:outline-none rounded">Clear Filters</button>
                                </div>
                            ) : (
                                filteredJobs.map(job => (
                                    <JobCard 
                                        key={job.id} 
                                        job={job} 
                                        onOpenDetail={handleOpenDetail} 
                                        onToggleStatus={toggleJobStatus} 
                                        onDelete={handleDelete} 
                                        isSelectMode={isSelectMode} 
                                        isSelected={selectedJobIds.has(job.id)} 
                                        onSelect={toggleJobSelection} 
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}
                
                {currentView === ViewState.KANBAN && (
                    <div className="h-full flex flex-col w-full">
                        {/* PIPELINE COMMAND DECK */}
                        <div className="px-6 py-4 bg-[#F5F5F7]/95 dark:bg-black/90 backdrop-blur-xl border-y border-black/5 dark:border-white/10 flex items-center justify-between gap-4 mb-2 shadow-sm transition-colors flex-none z-30">
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Pipeline</h1>
                                <div className="h-6 w-px bg-gray-300 dark:bg-white/10"></div>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{allJobs.filter(j => j.status !== 'archived' && j.status !== 'new').length} Active Opportunities</span>
                            </div>
                            <button onClick={() => setIsAddLinkOpen(true)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-black text-xs font-bold hover:scale-105 transition-transform shadow-lg shadow-black/5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1d1d1f] focus:outline-none">
                                <Plus size={14} /> Add Opportunity
                            </button>
                        </div>

                        <div className="flex-1 min-h-0 w-full pt-2">
                            <KanbanBoard jobs={allJobs} onGenerateKit={(job) => handleOpenDetail(job, 'strategy')} onToggleStatus={updateJobStatus} onDelete={handleDelete} onOpenDetail={handleOpenDetail} onOpenAddModal={() => setIsAddLinkOpen(true)}/>
                        </div>
                    </div>
                )}

                {currentView === ViewState.CV_EDITOR && (
                    <div className="h-full flex flex-col items-center w-full">
                        {/* RESUME STUDIO COMMAND DECK */}
                        <div className="w-full px-6 py-4 bg-[#F5F5F7]/95 dark:bg-black/90 backdrop-blur-xl border-y border-black/5 dark:border-white/10 flex items-center justify-between gap-4 mb-6 shadow-sm transition-colors flex-none z-30">
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Resume Studio</h1>
                                {targetJobForEditor && (
                                     <>
                                        <div className="h-6 w-px bg-gray-300 dark:bg-white/10"></div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full text-[#0071e3] text-xs font-bold border border-blue-100 dark:border-blue-500/20">
                                            <Briefcase size={12} /> Target: {targetJobForEditor.company}
                                        </div>
                                     </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Future actions like Export/Print can go here */}
                            </div>
                        </div>

                        <div className="flex-1 w-full relative min-h-0">
                            <CVEditor targetJob={targetJobForEditor} allJobs={allJobs} />
                        </div>
                    </div>
                )}
            </div>
        </main>

        {/* MOBILE NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl z-[45] border-t border-black/5 dark:border-white/5 sm:hidden flex items-center justify-around px-4 transition-colors duration-300">
             <button 
                onClick={() => { setCurrentView(ViewState.DASHBOARD); setTargetJobId(null); }} 
                className={`flex flex-col items-center gap-1 transition-all ${currentView === ViewState.DASHBOARD ? 'text-[#0071e3] scale-110' : 'text-gray-400'}`}
             >
                <Home size={22} />
                <span className="text-[10px] font-bold">Discover</span>
             </button>
             <button 
                onClick={() => { setCurrentView(ViewState.KANBAN); setTargetJobId(null); }} 
                className={`flex flex-col items-center gap-1 transition-all ${currentView === ViewState.KANBAN ? 'text-[#0071e3] scale-110' : 'text-gray-400'}`}
             >
                <Briefcase size={22} />
                <span className="text-[10px] font-bold">Pipeline</span>
             </button>
             <button 
                onClick={() => setCurrentView(ViewState.CV_EDITOR)} 
                className={`flex flex-col items-center gap-1 transition-all ${currentView === ViewState.CV_EDITOR ? 'text-[#0071e3] scale-110' : 'text-gray-400'}`}
             >
                <FileText size={22} />
                <span className="text-[10px] font-bold">Resume</span>
             </button>
        </nav>

      <JobDetailModal isOpen={modalOpen} onClose={() => setModalOpen(false)} job={selectedJob} onGenerateKit={handleGenerateKit} initialTab={initialModalTab} onUpdateJob={handleUpdateJob} onReAnalyze={handleReAnalyzeJob} onTailorResume={handleTailorResume}/>
      <AddLinkModal isOpen={isAddLinkOpen} onClose={() => setIsAddLinkOpen(false)} onAdd={handleAddManualJob} existingJobs={allJobs}/>
    </div>
  );
};

export default App;