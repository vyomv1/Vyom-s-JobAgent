
import React, { useState, useEffect } from 'react';
import { Job, ViewState } from './types';
import { searchAndParseJobs, analyzeJob, generateApplicationKit } from './services/geminiService';
import { initFirebase, subscribeToJobs, addOrUpdateJob, updateJobStatus, deleteJob, saveAnalysis } from './services/firebase';
import { DEFAULT_FIREBASE_CONFIG } from './constants';
import JobCard from './components/JobCard';
import StatsPanel from './components/StatsPanel';
import KanbanBoard from './components/KanbanBoard';
import CVEditor from './components/CVEditor';
import JobDetailModal from './components/JobDetailModal';
import { Bot, Layout, Columns, FileText, CheckCircle2, Filter, Sparkles, Plus, Search, ArrowDownUp, Globe } from 'lucide-react';

const App: React.FC = () => {
  // Navigation & Data
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [activeTab, setActiveTab] = useState<'new' | 'saved' | 'archived'>('new');
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  
  // Auto-Init Firebase
  const [isDbConnected, setIsDbConnected] = useState(() => {
    return initFirebase(DEFAULT_FIREBASE_CONFIG);
  });
  
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

  const locationCounts = allJobs.reduce((acc, job) => {
    const locRaw = job.location.toLowerCase();
    let key = 'Other';
    if (locRaw.includes('edinburgh')) key = 'Edinburgh';
    else if (locRaw.includes('glasgow')) key = 'Glasgow';
    else if (locRaw.includes('remote')) key = 'Remote';
    else if (locRaw.includes('london')) key = 'London';
    else if (locRaw.includes('manchester')) key = 'Manchester';
    if ((job.status || 'new') === 'new') {
        acc[key] = (acc[key] || 0) + 1;
        acc['All'] = (acc['All'] || 0) + 1;
    }
    return acc;
  }, { 'All': 0 } as Record<string, number>);

  const filterOptions = ['All', 'Edinburgh', 'Glasgow', 'Remote', 'London', 'Manchester', 'Other'];

  const filteredJobs = allJobs.filter(j => {
    const status = j.status || 'new';
    if (activeTab === 'new') return status === 'new';
    if (activeTab === 'saved') return ['saved', 'applied', 'interview', 'offer'].includes(status);
    if (activeTab === 'archived') return status === 'archived';
    return true;
  }).filter(j => {
    const locMatch = cityFilter === 'All' ? true : (cityFilter === 'Other' ? !['edinburgh', 'glasgow', 'remote', 'london', 'manchester'].some(s => j.location.toLowerCase().includes(s)) : j.location.toLowerCase().includes(cityFilter.toLowerCase()));
    if (!locMatch) return false;
    
    // Industry Filter
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

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#202124] font-sans pb-20 selection:bg-[#E8F0FE] selection:text-[#1a73e8]">
      
      {/* FLOATING HEADER */}
      <div className="sticky top-4 z-40 px-4 mb-4 flex justify-center">
          <header className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-full shadow-lg elevation-1 py-2 px-6 w-full max-w-2xl flex items-center justify-between transition-all">
             <div className="flex items-center gap-3">
                 <div className="bg-[#1a73e8] p-2 rounded-full text-white shadow-sm">
                     <Bot size={20} fill="none" />
                 </div>
                 <span className="font-bold text-lg text-[#202124]">Vyom's Job Agent</span>
             </div>

             <nav className="flex items-center gap-1 bg-[#F1F3F4] p-1 rounded-full">
                 {[
                   { id: ViewState.DASHBOARD, label: 'Dashboard', icon: Layout },
                   { id: ViewState.KANBAN, label: 'Pipeline', icon: Columns },
                   { id: ViewState.CV_EDITOR, label: 'CV', icon: FileText }
                 ].map(item => (
                   <button 
                     key={item.id}
                     onClick={() => setCurrentView(item.id)} 
                     className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${currentView === item.id ? 'bg-[#202124] text-white shadow-md' : 'text-[#5F6368] hover:text-[#202124] hover:bg-white/50'}`}
                   >
                      <item.icon size={16} />
                      <span className="hidden sm:inline">{item.label}</span>
                   </button>
                 ))}
             </nav>
          </header>
      </div>

      <main className="max-w-[1600px] mx-auto px-6 mt-8">
        
        {/* WELCOME HEADER - CENTERED WITH SCOUT BUTTON */}
        {currentView === ViewState.DASHBOARD && (
            <div className="mb-20 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center max-w-2xl mx-auto flex flex-col items-center">
                <h1 className="text-4xl font-normal text-[#202124] tracking-tight">
                    Welcome back, <span className="font-bold">Vyom.</span>
                </h1>
                <p className="text-[#5F6368] mt-2 text-lg mb-4">
                    You have <span className="font-bold text-[#1a73e8]">{allJobs.filter(j => j.status === 'saved').length} saved jobs</span> and <span className="font-bold text-[#137333]">{allJobs.filter(j => j.status === 'interview').length} active interviews</span>.
                </p>

                <button
                    onClick={fetchJobs}
                    disabled={isFetching}
                    className="group relative px-6 py-3 bg-white border border-[#DADCE0] text-[#5F6368] rounded-full font-bold text-sm shadow-sm hover:bg-[#F1F3F4] hover:text-[#202124] active:scale-95 transition-all flex items-center gap-2 mb-20"
                >
                    {isFetching ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-[#5F6368] border-t-transparent rounded-full animate-spin"></span>
                            Scouting Market...
                        </span>
                    ) : (
                        <>
                            <Search size={18} />
                            <span>Scout New Jobs</span>
                        </>
                    )}
                    
                    {analyzingCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#DB4437] text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-bounce border border-white">
                            {analyzingCount} analyzing
                        </span>
                    )}
                </button>
            </div>
        )}

        {currentView === ViewState.DASHBOARD && (
        <div className="grid grid-cols-12 gap-8 items-start relative">
            {/* SIDEBAR FILTER PANEL */}
            <div className="col-span-12 lg:col-span-3">
               <div className="sticky top-28 space-y-6">
                    <div className="bg-[#F1F3F4] p-6 rounded-[28px] border border-white shadow-sm ring-1 ring-[#DADCE0]/50">
                        <div className="flex items-center gap-2 mb-6 text-[#5F6368]">
                            <Filter size={20} />
                            <span className="text-sm font-bold uppercase tracking-wider">Smart Filters</span>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-[#70757A] ml-1 uppercase">Location</p>
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.map(city => {
                                    const count = locationCounts[city] || 0;
                                    if (count === 0 && city !== 'All') return null;
                                    const isActive = cityFilter === city;
                                    return (
                                        <button 
                                            key={city} 
                                            onClick={() => setCityFilter(city)} 
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 border ${isActive ? 'bg-[#202124] text-white border-transparent shadow-sm' : 'bg-white text-[#5F6368] border-[#DADCE0] hover:border-[#202124]'}`}
                                        >
                                            {city} <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-[#F1F3F4]'}`}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="h-px bg-[#DADCE0] my-6"></div>
                        <StatsPanel 
                            jobs={allJobs} 
                            selectedIndustry={industryFilter}
                            onSelectIndustry={setIndustryFilter}
                        />

                        <div className="h-px bg-[#DADCE0] my-6"></div>
                        
                        <div>
                            <h3 className="text-xs font-bold text-[#70757A] uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span> Active Sources
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {['LinkedIn', 'Glassdoor', 'Indeed', 'Otta', 'Reed', 'TotalJobs', 'Behance'].map(p => (
                                    <span key={p} className="px-2.5 py-1.5 bg-white border border-[#DADCE0] rounded-lg text-[11px] font-bold text-[#5F6368] shadow-sm cursor-default hover:border-[#202124] transition-colors">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
               </div>
            </div>

            {/* MAIN CONTENT LIST */}
            <div className="col-span-12 lg:col-span-9 min-h-screen">
                
                {/* Tabs & Sort */}
                <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {['new', 'saved', 'archived'].map((tab) => {
                            const count = allJobs.filter(j => {
                                    if (tab === 'new') return (j.status || 'new') === 'new';
                                    if (tab === 'saved') return ['saved', 'applied', 'interview', 'offer'].includes(j.status || '');
                                    return j.status === 'archived';
                                }).length;
                            const isActive = activeTab === tab;
                            return (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)} 
                                    className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-all whitespace-nowrap border ${isActive ? 'bg-[#E8F0FE] text-[#1967D2] border-transparent shadow-sm' : 'bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4]'}`}
                                >
                                    {tab} <span className="opacity-60 text-xs ml-1">({count})</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-[#DADCE0]">
                         <button 
                            onClick={() => setSortBy('date')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${sortBy === 'date' ? 'bg-[#202124] text-white' : 'text-[#5F6368] hover:bg-[#F1F3F4]'}`}
                         >
                            Date
                         </button>
                         <button 
                            onClick={() => setSortBy('score')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${sortBy === 'score' ? 'bg-[#202124] text-white' : 'text-[#5F6368] hover:bg-[#F1F3F4]'}`}
                         >
                            Score <ArrowDownUp size={12} />
                         </button>
                    </div>
                </div>

                <div className="space-y-4 pb-24">
                    {filteredJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[32px] border border-dashed border-[#DADCE0] text-[#70757A]">
                            <CheckCircle2 size={64} className="mb-4 text-[#DADCE0]" />
                            <h3 className="text-xl font-bold text-[#5F6368]">All caught up</h3>
                            <p className="text-sm font-medium">No jobs match your current filters.</p>
                            {(cityFilter !== 'All' || industryFilter) && (
                                <button onClick={() => { setCityFilter('All'); setIndustryFilter(null); }} className="mt-4 text-[#1a73e8] font-bold text-sm">Clear Filters</button>
                            )}
                        </div>
                    ) : (
                        filteredJobs.map(job => (
                            <JobCard key={job.id} job={job} onOpenDetail={handleOpenDetail} onToggleStatus={toggleJobStatus} onDelete={handleDelete} />
                        ))
                    )}
                </div>
            </div>
        </div>
        )}

        {currentView === ViewState.KANBAN && (
            <KanbanBoard 
                jobs={allJobs} 
                onGenerateKit={(job) => handleOpenDetail(job, 'strategy')}
                onToggleStatus={handleKanbanMove}
                onDelete={handleDelete}
                onOpenDetail={handleOpenDetail}
            />
        )}

        {currentView === ViewState.CV_EDITOR && (
            <CVEditor />
        )}

      </main>

      <JobDetailModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        job={selectedJob} 
        onGenerateKit={handleGenerateKit}
        initialTab={initialModalTab}
      />
    </div>
  );
};

export default App;
