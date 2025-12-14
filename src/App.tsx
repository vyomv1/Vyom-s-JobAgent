
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
import { LayoutGrid, Kanban, FileText, Plus, Search, Command, Sparkles, ArrowDownUp, Layers, Moon, Sun, User, LogOut, ChevronDown } from 'lucide-react';

const App: React.FC = () => {
  // Navigation & Data
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [activeTab, setActiveTab] = useState<'new' | 'saved' | 'archived'>('new');
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  
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

  // Status
  const [isFetching, setIsFetching] = useState(false);
  const [analyzingCount, setAnalyzingCount] = useState(0);
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [initialModalTab, setInitialModalTab] = useState<'brief' | 'strategy'>('brief');
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

  // Click Outside Profile Menu
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
              setIsProfileMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDbConnected) {
      const unsubscribe = subscribeToJobs((jobs) => {
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        jobs.forEach(job => {
            const scoutTime = job.scoutedAt || 0;
            if (scoutTime > 0 && scoutTime < ninetyDaysAgo && job.status !== 'archived') {
                updateJobStatus(job.id, 'archived');
            }
        });
        setAllJobs(jobs);
      });
      return () => unsubscribe();
    }
  }, [isDbConnected]);

  const fetchJobs = async () => {
    if (!isDbConnected) return;
    setIsFetching(true);
    const query = `("Product Designer" OR "UX Designer" OR "UI Designer") "United Kingdom" -Intern -Trainee -Apprentice`;
    try {
      const foundJobs = await searchAndParseJobs(query);
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
      if (jobsToAnalyze.length > 0) analyzeNewJobs(jobsToAnalyze);
    } catch (error) { console.error(error); }
    setIsFetching(false);
  };

  const analyzeNewJobs = async (jobs: Job[]) => {
      setAnalyzingCount(prev => prev + jobs.length);
      for (const job of jobs) {
        try {
            const analysis = await analyzeJob(job);
            await saveAnalysis(job.id, analysis);
        } catch (e) {
            console.error(`Analysis failed for job ${job.id}`, e);
        } finally {
            setAnalyzingCount(prev => Math.max(0, prev - 1));
            await new Promise(resolve => setTimeout(resolve, 2000));
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

  const handleKanbanMove = (jobId: string, destination: Job['status']) => {
      updateJobStatus(jobId, destination!);
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

  const handleAddManualJob = async (data: { url?: string, text?: string, title?: string, company?: string }) => {
      try {
          if (currentView !== ViewState.DASHBOARD && currentView !== ViewState.KANBAN) {
              setCurrentView(ViewState.DASHBOARD);
              setActiveTab('saved');
          }
          const placeholder = await addManualJob(data);
          if (!placeholder) return;
          
          setAnalyzingCount(prev => prev + 1);
          const enrichedDetails = await enrichJob(data);
          const enrichedJob = { 
              ...placeholder, 
              ...enrichedDetails,
              summary: enrichedDetails.summary || data.text || placeholder.summary
          };
          await addOrUpdateJob(enrichedJob);
          const analysis = await analyzeJob(enrichedJob);
          await saveAnalysis(enrichedJob.id, analysis);
      } catch (e) {
          console.error("Error adding manual job", e);
      } finally {
          setAnalyzingCount(prev => Math.max(0, prev - 1));
      }
  };

  // --- FILTER LOGIC ---
  const jobsInCurrentTab = useMemo(() => {
    return allJobs.filter(j => {
        const status = j.status || 'new';
        if (activeTab === 'new') return status === 'new';
        if (activeTab === 'saved') return ['saved', 'applied', 'interview', 'offer'].includes(status);
        if (activeTab === 'archived') return status === 'archived';
        return false;
    });
  }, [allJobs, activeTab]);

  const filteredJobs = useMemo(() => {
      return jobsInCurrentTab.filter(j => {
        const locMatch = cityFilter === 'All' ? true : (cityFilter === 'Other' ? !['edinburgh', 'glasgow', 'remote', 'london', 'manchester'].some(s => j.location.toLowerCase().includes(s)) : j.location.toLowerCase().includes(cityFilter.toLowerCase()));
        if (!locMatch) return false;
        
        if (industryFilter) {
            const ind = j.analysis?.industry || 'Tech';
            if (ind !== industryFilter) {
                 const text = (j.company + " " + j.title + " " + (j.summary || "")).toLowerCase();
                 let calculatedIndustry = 'Tech';
                 if (text.match(/bank|finance|wealth|fintech/)) calculatedIndustry = 'Fintech';
                 else if (text.match(/insurance|underwrit/)) calculatedIndustry = 'Insurance';
                 else if (text.match(/gov|public|council|nhs/)) calculatedIndustry = 'Public Sector';
                 else if (text.match(/agency|studio/)) calculatedIndustry = 'Agency';
                 
                 if (calculatedIndustry !== industryFilter) return false;
            }
        }
        return true;
      }).sort((a, b) => {
          if (sortBy === 'score') {
              return (b.analysis?.score || 0) - (a.analysis?.score || 0);
          }
          return (b.scoutedAt || 0) - (a.scoutedAt || 0);
      });
  }, [jobsInCurrentTab, cityFilter, industryFilter, sortBy]);

  const filterOptions = ['All', 'Edinburgh', 'Glasgow', 'Remote', 'London', 'Manchester', 'Other'];

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black pb-20 font-sans overflow-x-hidden transition-colors duration-300">
        
        {/* GLOBAL NAVIGATION BAR */}
        <nav className="fixed top-0 left-0 right-0 h-14 bg-[#1d1d1f]/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl z-[40] border-b border-white/5 dark:border-white/10 transition-colors duration-300">
            <div className="max-w-[1024px] mx-auto h-full flex items-center justify-between px-6">
                 <div className="flex items-center gap-6">
                     <span className="font-semibold text-base tracking-tight text-white flex items-center gap-2"><Layers size={18} /> Career Studio</span>
                     <div className="hidden sm:flex items-center gap-6 text-[#d2d2d7]">
                         <button onClick={() => setCurrentView(ViewState.DASHBOARD)} className={`transition-colors hover:text-white ${currentView === ViewState.DASHBOARD ? 'text-white' : ''}`}>Discover</button>
                         <button onClick={() => setCurrentView(ViewState.KANBAN)} className={`transition-colors hover:text-white ${currentView === ViewState.KANBAN ? 'text-white' : ''}`}>Pipeline</button>
                         <button onClick={() => setCurrentView(ViewState.CV_EDITOR)} className={`transition-colors hover:text-white ${currentView === ViewState.CV_EDITOR ? 'text-white' : ''}`}>Resume</button>
                     </div>
                 </div>
                 
                 <div className="flex items-center gap-4">
                     {analyzingCount > 0 && (
                        <span className="flex items-center gap-1.5 text-[#0071e3] dark:text-[#0A84FF] font-medium text-[12px]">
                            <Sparkles size={12} className="animate-spin" /> Analyzing...
                        </span>
                     )}
                     
                     {/* Profile Dropdown */}
                     <div className="relative" ref={profileMenuRef}>
                        <button 
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white/10 transition-all focus:outline-none"
                        >
                            VP
                        </button>

                        {isProfileMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#1C1C1E] rounded-xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-3 border-b border-[#f5f5f7] dark:border-[#38383A]">
                                    <p className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Vyom Pathroliya</p>
                                    <p className="text-xs text-[#86868b] dark:text-[#98989D]">Senior UX Designer</p>
                                </div>
                                <div className="p-1">
                                    <button 
                                        onClick={() => setDarkMode(!darkMode)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                                            <span>Dark Mode</span>
                                        </div>
                                        
                                        {/* Toggle Switch Visual */}
                                        <div className={`w-9 h-5 rounded-full relative transition-colors ${darkMode ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'}`}>
                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                    </button>
                                    
                                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] rounded-lg transition-colors opacity-50 cursor-not-allowed">
                                        <User size={16} /> Profile Settings
                                    </button>
                                    <div className="h-px bg-[#f5f5f7] dark:bg-[#38383A] my-1"></div>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#FF3B30] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] rounded-lg transition-colors">
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                     </div>
                 </div>
            </div>
        </nav>

        {/* HERO SECTION */}
        <div className={`pt-24 pb-10 ${currentView === ViewState.KANBAN ? 'w-full' : 'max-w-[1024px] mx-auto px-6'}`}>
            {currentView === ViewState.DASHBOARD && (
                <>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in-up">
                        <div>
                            <h1 className="text-[48px] md:text-[64px] leading-[1.05] font-semibold text-[#1d1d1f] dark:text-white tracking-tight mb-4 transition-colors">
                                Masterplan your <br/>
                                <span className="text-[#86868b] dark:text-[#98989D]">next move.</span>
                            </h1>
                            <p className="text-[#1d1d1f] dark:text-[#f5f5f7] text-lg font-medium max-w-lg leading-relaxed transition-colors">
                                <span className="text-[#0071e3] dark:text-[#0A84FF] font-semibold">{allJobs.filter(j => j.status === 'saved').length} opportunities</span> tailored to your experience.
                            </p>
                        </div>
                        
                        <div className="flex gap-3 pb-2">
                             <button 
                                onClick={fetchJobs} 
                                disabled={isFetching}
                                className={`h-10 px-6 rounded-full bg-[#0071e3] hover:bg-[#0077ED] dark:bg-[#0A84FF] dark:hover:bg-[#409CFF] text-white text-sm font-medium transition-all flex items-center gap-2 ${isFetching ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20'}`}
                             >
                                <Search size={16} /> {isFetching ? 'Scouting...' : 'Scout Jobs'}
                             </button>
                             <button 
                                onClick={() => setIsAddLinkOpen(true)}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-[#E8E8ED] hover:bg-[#d2d2d7] dark:bg-[#38383A] dark:hover:bg-[#48484A] text-[#1d1d1f] dark:text-white transition-all hover:scale-105 active:scale-95"
                             >
                                <Plus size={18} />
                             </button>
                        </div>
                    </div>

                    {/* DASHBOARD GRID LAYOUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* LEFT COLUMN: FILTERS & WIDGETS */}
                        <div className="lg:col-span-3 space-y-6 sticky top-[80px] self-start z-10">
                            {/* Filter Widget */}
                            <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 shadow-sm border border-black/5 dark:border-white/10 transition-colors">
                                <h3 className="text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-3">Locations</h3>
                                <div className="space-y-1">
                                    {filterOptions.map(city => {
                                        const count = city === 'All' ? jobsInCurrentTab.length : jobsInCurrentTab.filter(j => city === 'Other' ? !['edinburgh', 'glasgow', 'remote', 'london', 'manchester'].some(s => j.location.toLowerCase().includes(s)) : j.location.toLowerCase().includes(city.toLowerCase())).length;
                                        if (count === 0 && city !== 'All') return null;
                                        const isSelected = cityFilter === city;
                                        return (
                                            <button 
                                                key={city} 
                                                onClick={() => setCityFilter(city)} 
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all ${isSelected ? 'bg-[#F5F5F7] dark:bg-[#2C2C2E] font-semibold text-[#0071e3] dark:text-[#0A84FF]' : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]'}`}
                                            >
                                                <span>{city}</span>
                                                <span className="text-[#86868b] dark:text-[#98989D] text-[11px]">{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <div className="w-full h-px bg-[#F5F5F7] dark:bg-[#38383A] my-5"></div>
                                
                                <StatsPanel 
                                    jobs={jobsInCurrentTab} 
                                    selectedIndustry={industryFilter}
                                    onSelectIndustry={setIndustryFilter}
                                />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: CONTENT */}
                        <div className="lg:col-span-9">
                            {/* Tabs Pill */}
                            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                                {['new', 'saved', 'archived'].map((tab) => {
                                    const isActive = activeTab === tab;
                                    return (
                                        <button 
                                            key={tab}
                                            onClick={() => setActiveTab(tab as any)} 
                                            className={`px-5 py-2 rounded-full text-[13px] font-medium capitalize whitespace-nowrap transition-all ${isActive ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-[#1C1C1E] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#d2d2d7] dark:border-[#38383A] hover:border-[#86868b]'}`}
                                        >
                                            {tab}
                                        </button>
                                    );
                                })}
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-[11px] text-[#86868b] dark:text-[#98989D] font-medium mr-1">Sort by:</span>
                                    <button 
                                        onClick={() => setSortBy(sortBy === 'date' ? 'score' : 'date')}
                                        className="text-[11px] font-bold text-[#0071e3] dark:text-[#0A84FF] hover:underline flex items-center gap-1"
                                    >
                                        {sortBy === 'date' ? 'Date' : 'Match Score'} <ArrowDownUp size={12}/>
                                    </button>
                                </div>
                            </div>

                            {/* Job List */}
                            <div className="space-y-6">
                                {filteredJobs.length === 0 ? (
                                    <div className="py-20 text-center text-[#86868b] dark:text-[#98989D]">
                                        <p className="text-lg font-medium">No opportunities found.</p>
                                        <button onClick={() => { setCityFilter('All'); setIndustryFilter(null); }} className="text-[#0071e3] dark:text-[#0A84FF] font-medium mt-2 hover:underline">Clear Filters</button>
                                    </div>
                                ) : (
                                    filteredJobs.map(job => (
                                        <JobCard key={job.id} job={job} onOpenDetail={handleOpenDetail} onToggleStatus={toggleJobStatus} onDelete={handleDelete} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {currentView === ViewState.KANBAN && (
                <div className="h-[calc(100vh-100px)] animate-fade-in-up flex flex-col w-full">
                    <div className="flex items-center justify-between mb-8 w-full max-w-[1024px] mx-auto px-6">
                        <h1 className="text-[40px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Pipeline</h1>
                        <button 
                            onClick={() => setIsAddLinkOpen(true)}
                            className="h-10 px-5 rounded-full bg-[#1d1d1f] dark:bg-white hover:bg-black dark:hover:bg-[#E5E5EA] text-white dark:text-black text-sm font-medium transition-all flex items-center gap-2 shadow-lg"
                        >
                            <Plus size={16} /> Add Job
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                        <KanbanBoard 
                            jobs={allJobs} 
                            onGenerateKit={(job) => handleOpenDetail(job, 'strategy')}
                            onToggleStatus={handleKanbanMove}
                            onDelete={handleDelete}
                            onOpenDetail={handleOpenDetail}
                            onOpenAddModal={() => setIsAddLinkOpen(true)}
                        />
                    </div>
                </div>
            )}

            {currentView === ViewState.CV_EDITOR && (
                <div className="h-[calc(100vh-60px)] animate-fade-in-up flex flex-col items-center">
                    <div className="w-full max-w-[1024px] mb-6 px-6">
                        <h1 className="text-[40px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Resume</h1>
                    </div>
                    <div className="flex-1 w-full relative">
                        <CVEditor />
                    </div>
                </div>
            )}
        </div>

      <JobDetailModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        job={selectedJob} 
        onGenerateKit={handleGenerateKit}
        initialTab={initialModalTab}
        onUpdateJob={handleUpdateJob}
        onReAnalyze={handleReAnalyzeJob}
      />
      
      <AddLinkModal 
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
        onAdd={handleAddManualJob}
      />
    </div>
  );
};

export default App;
