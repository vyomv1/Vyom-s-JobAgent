
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
import { Zap, Layout, Columns, FileText, CheckCircle2, Filter, Sparkles, Plus } from 'lucide-react';

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
    if (cityFilter !== 'All') {
        const loc = j.location.toLowerCase();
        if (cityFilter === 'Other') return !['edinburgh', 'glasgow', 'remote', 'london', 'manchester'].some(s => loc.includes(s));
        return loc.includes(cityFilter.toLowerCase());
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FFF8F6] text-[#2D1810] font-sans pb-20 selection:bg-[#FFDBC8] selection:text-[#2D1810]">
      
      {/* FLOATING HEADER */}
      <div className="sticky top-4 z-40 px-4 mb-4 flex justify-center">
          <header className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-full shadow-lg elevation-1 py-2 px-6 w-full max-w-2xl flex items-center justify-between transition-all">
             <div className="flex items-center gap-3">
                 <div className="bg-[#D97736] p-2 rounded-full text-white shadow-sm">
                     <Zap size={20} fill="currentColor" />
                 </div>
                 <span className="font-bold text-lg text-[#2D1810]">Job Agent</span>
             </div>

             <nav className="flex items-center gap-1 bg-[#FDF2EC] p-1 rounded-full">
                 {[
                   { id: ViewState.DASHBOARD, label: 'Dashboard', icon: Layout },
                   { id: ViewState.KANBAN, label: 'Pipeline', icon: Columns },
                   { id: ViewState.CV_EDITOR, label: 'CV', icon: FileText }
                 ].map(item => (
                   <button 
                     key={item.id}
                     onClick={() => setCurrentView(item.id)} 
                     className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${currentView === item.id ? 'bg-[#2D1810] text-white shadow-md' : 'text-[#5D4037] hover:text-[#2D1810] hover:bg-white/50'}`}
                   >
                      <item.icon size={16} />
                      <span className="hidden sm:inline">{item.label}</span>
                   </button>
                 ))}
             </nav>
          </header>
      </div>

      <main className="max-w-[1600px] mx-auto px-6 mt-6">
        
        {currentView === ViewState.DASHBOARD && (
        <div className="grid grid-cols-12 gap-8 items-start relative">
            {/* SIDEBAR FILTER PANEL */}
            <div className="col-span-12 lg:col-span-3">
               {/* This div acts as the sticky container */}
               <div className="sticky top-28 space-y-6">
                    <div className="bg-[#FDF2EC] p-6 rounded-[28px] border border-[#EFEBE9]">
                        <div className="flex items-center gap-2 mb-6">
                            <Filter size={20} className="text-[#5D4037]" />
                            <span className="text-sm font-bold text-[#5D4037] uppercase tracking-wider">Filters</span>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-[#A1887F] ml-1 uppercase">Location</p>
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.map(city => {
                                    const count = locationCounts[city] || 0;
                                    if (count === 0 && city !== 'All') return null;
                                    const isActive = cityFilter === city;
                                    return (
                                        <button 
                                            key={city} 
                                            onClick={() => setCityFilter(city)} 
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 border ${isActive ? 'bg-[#D97736] text-white border-transparent shadow-sm' : 'bg-white text-[#5D4037] border-[#EFEBE9] hover:border-[#D7CCC8]'}`}
                                        >
                                            {city} <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-[#EFEBE9]'}`}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="h-px bg-[#EFEBE9] my-6"></div>
                        <StatsPanel jobs={allJobs} />
                    </div>
               </div>
            </div>

            {/* MAIN CONTENT LIST */}
            <div className="col-span-12 lg:col-span-9 min-h-screen">
                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
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
                                className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-all whitespace-nowrap border ${isActive ? 'bg-[#FFDBC8] text-[#2D1810] border-transparent shadow-sm' : 'bg-white text-[#5D4037] border-[#EFEBE9] hover:bg-[#FDF2EC]'}`}
                            >
                                {tab} <span className="opacity-60 text-xs ml-1">({count})</span>
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-4 pb-24">
                    {filteredJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[32px] border border-dashed border-[#D7CCC8] text-[#A1887F]">
                            <CheckCircle2 size={64} className="mb-4 text-[#EFEBE9]" />
                            <h3 className="text-xl font-bold text-[#5D4037]">All caught up</h3>
                            <p className="text-sm font-medium">No jobs match your current filters.</p>
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

      {/* FLOATING ACTION BUTTON (FAB) FOR SCOUTING */}
      {currentView === ViewState.DASHBOARD && (
        <button 
          onClick={fetchJobs}
          disabled={isFetching}
          className="fixed bottom-8 right-8 w-16 h-16 bg-[#D97736] text-white rounded-[20px] shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-50 group border border-white/20"
          title="Scout New Jobs"
        >
           {isFetching ? (
             <span className="relative flex h-6 w-6">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
               <span className="relative inline-flex rounded-full h-6 w-6 bg-white/50"></span>
             </span>
           ) : (
             <Sparkles size={28} />
           )}
           {analyzingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#2D1810] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                  {analyzingCount}
              </span>
           )}
        </button>
      )}

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
