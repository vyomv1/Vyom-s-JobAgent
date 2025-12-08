
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Calendar, Briefcase, MapPin, Zap, ArrowLeft, CheckCircle2, FileText, Sparkles, TrendingUp, AlertTriangle, Wand2 } from 'lucide-react';
import { Job } from '../types';
import { expandJobDescription } from '../services/geminiService';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onGenerateKit: (job: Job) => void;
  initialTab?: 'brief' | 'strategy';
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ isOpen, onClose, job, onGenerateKit, initialTab = 'brief' }) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'strategy'>(initialTab);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    setExpandedDescription(null);
  }, [initialTab, isOpen, job]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleExpandDescription = async () => {
    if (!job) return;
    setIsExpanding(true);
    try {
        const fullDesc = await expandJobDescription(job);
        setExpandedDescription(fullDesc);
        // Optimistically update local view, actual save happens via service if we wanted to persist
    } catch (e) {
        console.error("Failed to expand", e);
    }
    setIsExpanding(false);
  };

  if (!isOpen || !job) return null;

  const analysis = job.analysis;
  const applyUrl = job.url || `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}`;
  const displaySummary = expandedDescription || job.summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Surface */}
      <div className="relative bg-[#F8F9FA] w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl rounded-[28px] overflow-hidden border border-white/50 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#DADCE0]">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[#E8F0FE] text-[#1967D2] rounded-2xl flex items-center justify-center shadow-sm">
                  <Briefcase size={28} />
              </div>
              <div>
                  <h2 className="text-2xl font-bold text-[#202124] leading-tight">{job.title}</h2>
                  <p className="text-sm text-[#5F6368] flex items-center gap-2 mt-1 font-medium">
                      {job.company} <span className="w-1.5 h-1.5 bg-[#DADCE0] rounded-full"></span> {job.location}
                  </p>
              </div>
           </div>
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-[#F1F3F4] rounded-full text-[#5F6368] transition-colors">
             <X size={24} />
           </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white m-3 rounded-[24px] shadow-sm border border-[#DADCE0]">
                
                {/* Tabs */}
                <div className="flex items-center gap-2 mb-8 bg-[#F1F3F4] p-1.5 rounded-full w-fit border border-[#DADCE0]">
                    <button 
                        onClick={() => setActiveTab('brief')} 
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'brief' ? 'bg-[#202124] text-white shadow-md' : 'text-[#5F6368] hover:bg-white/50'}`}
                    >
                        <FileText size={16} /> Job Details
                    </button>
                    <button 
                        onClick={() => {
                            setActiveTab('strategy');
                            if (!analysis?.strategy) onGenerateKit(job);
                        }} 
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'strategy' ? 'bg-[#202124] text-white shadow-md' : 'text-[#5F6368] hover:bg-white/50'}`}
                    >
                        <Sparkles size={16} /> Strategy Kit
                    </button>
                </div>

                {activeTab === 'brief' ? (
                    <div className="prose prose-slate max-w-none text-[#202124]">
                        <div className="mb-8 flex flex-wrap gap-3">
                            {job.seniorityScore && (
                                <span className="px-3 py-1 bg-[#F1F3F4] text-[#202124] rounded-full text-xs font-bold border border-[#DADCE0]">{job.seniorityScore}</span>
                            )}
                            {analysis?.salary && (
                                <span className="px-3 py-1 bg-[#F1F3F4] text-[#202124] rounded-full text-xs font-bold border border-[#DADCE0]">{analysis.salary}</span>
                            )}
                            {analysis?.workPattern && (
                                <span className="px-3 py-1 bg-[#F1F3F4] text-[#202124] rounded-full text-xs font-bold border border-[#DADCE0]">{analysis.workPattern}</span>
                            )}
                             {analysis?.industry && (
                                <span className="px-3 py-1 bg-[#F1F3F4] text-[#202124] rounded-full text-xs font-bold border border-[#DADCE0]">{analysis.industry}</span>
                            )}
                        </div>

                        <div className="mb-10 relative">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-[#202124] uppercase tracking-wide">Full Description</h3>
                                {!expandedDescription && (
                                    <button 
                                        onClick={handleExpandDescription}
                                        disabled={isExpanding}
                                        className="text-xs font-bold text-[#1a73e8] hover:bg-[#E8F0FE] px-3 py-1.5 rounded-full transition-colors flex items-center gap-2 border border-[#E8F0FE]"
                                    >
                                        <Wand2 size={12} /> {isExpanding ? 'Expanding...' : 'Auto-Expand Description'}
                                    </button>
                                )}
                            </div>
                            
                            <div className={`text-[#3C4043] leading-relaxed whitespace-pre-wrap text-base transition-opacity duration-500 ${isExpanding ? 'opacity-50' : 'opacity-100'}`}>
                                {displaySummary}
                            </div>
                            
                            {expandedDescription && (
                                <div className="mt-4 p-3 bg-[#E8F0FE] text-[#1967D2] text-xs font-medium rounded-lg inline-block">
                                    ✨ Description expanded by AI based on role profile.
                                </div>
                            )}
                        </div>
                        
                        {analysis && (
                            <div className="bg-[#F8F9FA] p-6 rounded-[24px] border border-[#E8F0FE] shadow-sm">
                                <h4 className="text-sm font-black text-[#1967D2] mb-3 flex items-center gap-2 uppercase tracking-wide">
                                    <Zap size={18} className="fill-[#1967D2]" /> AI Verdict
                                </h4>
                                <p className="text-[#202124] font-medium mb-4 leading-relaxed">{analysis.verdict}</p>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.matchedKeywords.map((kw, i) => (
                                        <span key={i} className="px-4 py-1.5 bg-white border border-[#E8F0FE] text-xs font-bold rounded-full text-[#1967D2]">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                         <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[#202124]">Execution Strategy</h3>
                            <button onClick={() => onGenerateKit(job)} className="text-sm font-bold text-[#1a73e8] hover:bg-[#E8F0FE] px-4 py-2 rounded-full transition-colors flex items-center gap-2">
                                <Sparkles size={16} /> Regenerate
                            </button>
                         </div>
                         
                         {analysis?.strategy ? (
                             <div className="prose prose-slate max-w-none font-sans bg-[#F8F9FA] p-8 rounded-[24px] border border-[#DADCE0]">
                                 <div className="whitespace-pre-wrap leading-relaxed text-[#202124]">{analysis.strategy}</div>
                             </div>
                         ) : (
                             <div className="py-24 text-center text-[#70757A]">
                                 <Zap size={48} className="mx-auto mb-4 text-[#DADCE0] animate-pulse" />
                                 <p className="text-lg font-medium">Generating your tailored strategy...</p>
                                 <p className="text-sm mt-2">Connecting your case studies to requirements.</p>
                             </div>
                         )}
                    </div>
                )}
            </div>

            {/* Sidebar Metadata */}
            <div className="w-full md:w-80 bg-[#F8F9FA] p-6 overflow-y-auto shrink-0 border-l border-[#DADCE0]">
                
                <div className="bg-white p-5 rounded-[20px] shadow-sm mb-6 border border-[#DADCE0]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#70757A] block mb-3">Status</span>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${job.status === 'applied' ? 'bg-[#1a73e8] text-white' : 'bg-[#F1F3F4] text-[#202124]'}`}>
                        {job.status === 'new' ? 'Scouted' : (job.status || 'New').charAt(0).toUpperCase() + (job.status || 'new').slice(1)}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-[20px] shadow-sm flex flex-col gap-1 border border-[#DADCE0]">
                        <span className="text-xs font-bold text-[#70757A] uppercase">Company</span>
                        <div className="font-semibold text-[#202124]">{job.company}</div>
                    </div>
                    <div className="bg-white p-4 rounded-[20px] shadow-sm flex flex-col gap-1 border border-[#DADCE0]">
                        <span className="text-xs font-bold text-[#70757A] uppercase">Location</span>
                        <div className="font-semibold text-[#202124]">{job.location}</div>
                    </div>
                    <div className="bg-white p-4 rounded-[20px] shadow-sm flex flex-col gap-1 border border-[#DADCE0]">
                        <span className="text-xs font-bold text-[#70757A] uppercase">Posted</span>
                        <div className="font-semibold text-[#202124]">{job.postedDate || 'Recently'}</div>
                    </div>
                    
                    {analysis && (
                        <div className="bg-[#E8F0FE] p-5 rounded-[20px] mt-2 border border-[#1a73e8]/20">
                            <span className="text-xs font-bold text-[#202124] uppercase block mb-2">Match Score</span>
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-black text-[#202124]">{analysis.score}</span>
                                <span className="text-sm font-bold text-[#202124] mb-1.5">/100</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <a href={applyUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-[#202124] text-white text-base font-bold rounded-full hover:shadow-lg hover:bg-[#1a73e8] transition-all">
                        Apply on Site <ExternalLink size={18} />
                    </a>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
