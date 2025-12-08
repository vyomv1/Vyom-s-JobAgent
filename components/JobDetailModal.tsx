
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Calendar, Briefcase, MapPin, Zap, ArrowLeft, CheckCircle2, FileText, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { Job } from '../types';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onGenerateKit: (job: Job) => void;
  initialTab?: 'brief' | 'strategy';
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ isOpen, onClose, job, onGenerateKit, initialTab = 'brief' }) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'strategy'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !job) return null;

  const analysis = job.analysis;
  const applyUrl = job.url || `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Surface */}
      <div className="relative bg-[#FFF8F6] w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl rounded-[28px] overflow-hidden border border-white/50 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-[#FDF2EC] border-b border-[#EFEBE9]">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[#FFDBC8] text-[#D97736] rounded-2xl flex items-center justify-center shadow-sm">
                  <Briefcase size={28} />
              </div>
              <div>
                  <h2 className="text-2xl font-bold text-[#2D1810] leading-tight">{job.title}</h2>
                  <p className="text-sm text-[#5D4037] flex items-center gap-2 mt-1 font-medium">
                      {job.company} <span className="w-1.5 h-1.5 bg-[#D7CCC8] rounded-full"></span> {job.location}
                  </p>
              </div>
           </div>
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-[#FFDBC8] rounded-full text-[#5D4037] transition-colors">
             <X size={24} />
           </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white m-3 rounded-[24px] shadow-sm border border-[#EFEBE9]">
                
                {/* Tabs */}
                <div className="flex items-center gap-2 mb-8 bg-[#FDF2EC] p-1.5 rounded-full w-fit border border-[#EFEBE9]">
                    <button 
                        onClick={() => setActiveTab('brief')} 
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'brief' ? 'bg-[#2D1810] text-white shadow-md' : 'text-[#5D4037] hover:bg-white/50'}`}
                    >
                        <FileText size={16} /> Job Details
                    </button>
                    <button 
                        onClick={() => {
                            setActiveTab('strategy');
                            if (!analysis?.strategy) onGenerateKit(job);
                        }} 
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'strategy' ? 'bg-[#2D1810] text-white shadow-md' : 'text-[#5D4037] hover:bg-white/50'}`}
                    >
                        <Sparkles size={16} /> Strategy Kit
                    </button>
                </div>

                {activeTab === 'brief' ? (
                    <div className="prose prose-brown max-w-none text-[#2D1810]">
                        <div className="mb-8 flex flex-wrap gap-3">
                            {job.seniorityScore && (
                                <span className="px-3 py-1 bg-[#EFEBE9] text-[#3E2723] rounded-full text-xs font-bold border border-[#D7CCC8]">{job.seniorityScore}</span>
                            )}
                            {analysis?.salary && (
                                <span className="px-3 py-1 bg-[#EFEBE9] text-[#3E2723] rounded-full text-xs font-bold border border-[#D7CCC8]">{analysis.salary}</span>
                            )}
                            {analysis?.workPattern && (
                                <span className="px-3 py-1 bg-[#EFEBE9] text-[#3E2723] rounded-full text-xs font-bold border border-[#D7CCC8]">{analysis.workPattern}</span>
                            )}
                             {analysis?.industry && (
                                <span className="px-3 py-1 bg-[#EFEBE9] text-[#3E2723] rounded-full text-xs font-bold border border-[#D7CCC8]">{analysis.industry}</span>
                            )}
                        </div>

                        <div className="mb-10">
                            <h3 className="text-lg font-bold text-[#2D1810] mb-4 uppercase tracking-wide">Full Description</h3>
                            <div className="text-[#3E2723] leading-relaxed whitespace-pre-wrap text-base">
                                {job.summary}
                            </div>
                        </div>
                        
                        {analysis && (
                            <div className="bg-[#FFF8F6] p-6 rounded-[24px] border border-[#FFDBC8] shadow-sm">
                                <h4 className="text-sm font-black text-[#D97736] mb-3 flex items-center gap-2 uppercase tracking-wide">
                                    <Zap size={18} className="fill-[#D97736]" /> AI Verdict
                                </h4>
                                <p className="text-[#2D1810] font-medium mb-4 leading-relaxed">{analysis.verdict}</p>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.matchedKeywords.map((kw, i) => (
                                        <span key={i} className="px-4 py-1.5 bg-white border border-[#FFDBC8] text-xs font-bold rounded-full text-[#D97736]">
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
                            <h3 className="text-xl font-bold text-[#2D1810]">Execution Strategy</h3>
                            <button onClick={() => onGenerateKit(job)} className="text-sm font-bold text-[#D97736] hover:bg-[#FFDBC8] px-4 py-2 rounded-full transition-colors flex items-center gap-2">
                                <Sparkles size={16} /> Regenerate
                            </button>
                         </div>
                         
                         {analysis?.strategy ? (
                             <div className="prose prose-brown max-w-none font-sans bg-[#FFF8F6] p-8 rounded-[24px] border border-[#EFEBE9]">
                                 <div className="whitespace-pre-wrap leading-relaxed text-[#3E2723]">{analysis.strategy}</div>
                             </div>
                         ) : (
                             <div className="py-24 text-center text-[#A1887F]">
                                 <Zap size={48} className="mx-auto mb-4 text-[#D7CCC8] animate-pulse" />
                                 <p className="text-lg font-medium">Generating your tailored strategy...</p>
                                 <p className="text-sm mt-2">Connecting your case studies to requirements.</p>
                             </div>
                         )}
                    </div>
                )}
            </div>

            {/* Sidebar Metadata */}
            <div className="w-full md:w-80 bg-[#FDF2EC] p-6 overflow-y-auto shrink-0 border-l border-[#EFEBE9]">
                
                <div className="bg-white p-5 rounded-[20px] shadow-sm mb-6 border border-[#EFEBE9]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#A1887F] block mb-3">Status</span>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${job.status === 'applied' ? 'bg-[#D97736] text-white' : 'bg-[#EFEBE9] text-[#2D1810]'}`}>
                        {job.status === 'new' ? 'Scouted' : (job.status || 'New').charAt(0).toUpperCase() + (job.status || 'new').slice(1)}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-[20px] shadow-sm flex flex-col gap-1 border border-[#EFEBE9]">
                        <span className="text-xs font-bold text-[#A1887F] uppercase">Company</span>
                        <div className="font-semibold text-[#2D1810]">{job.company}</div>
                    </div>
                    <div className="bg-white p-4 rounded-[20px] shadow-sm flex flex-col gap-1 border border-[#EFEBE9]">
                        <span className="text-xs font-bold text-[#A1887F] uppercase">Location</span>
                        <div className="font-semibold text-[#2D1810]">{job.location}</div>
                    </div>
                    <div className="bg-white p-4 rounded-[20px] shadow-sm flex flex-col gap-1 border border-[#EFEBE9]">
                        <span className="text-xs font-bold text-[#A1887F] uppercase">Posted</span>
                        <div className="font-semibold text-[#2D1810]">{job.postedDate || 'Recently'}</div>
                    </div>
                    
                    {analysis && (
                        <div className="bg-[#FFDBC8] p-5 rounded-[20px] mt-2 border border-[#D97736]/20">
                            <span className="text-xs font-bold text-[#2D1810] uppercase block mb-2">Match Score</span>
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-black text-[#2D1810]">{analysis.score}</span>
                                <span className="text-sm font-bold text-[#2D1810] mb-1.5">/100</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <a href={applyUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-[#2D1810] text-white text-base font-bold rounded-full hover:shadow-lg hover:bg-[#D97736] transition-all">
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
