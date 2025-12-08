
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Briefcase, Zap, FileText, Sparkles } from 'lucide-react';
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
  }, [initialTab, isOpen, job]);

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
      <div className="relative bg-[#F8F9FA] w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl rounded-[28px] overflow-hidden border border-white/50 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (Fixed) */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#DADCE0] shrink-0">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[#E8F0FE] text-[#1967D2] rounded-2xl flex items-center justify-center shadow-sm">
                  <Briefcase size={28} />
              </div>
              <div>
                  <h2 className="text-2xl font-bold text-[#202124] leading-tight">{job.title}</h2>
                  <p className="text-sm text-[#5F6368] font-medium mt-1">
                      {job.company}
                  </p>
              </div>
           </div>
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-[#F1F3F4] rounded-full text-[#5F6368] transition-colors">
             <X size={24} />
           </button>
        </div>

        {/* Unified Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
                
                {/* Main Content Area (Left) */}
                <div className="flex-1 order-2 md:order-1">
                    
                    {/* Tabs */}
                    <div className="flex items-center gap-2 mb-8 bg-[#F1F3F4] p-1 rounded-full w-fit border border-[#DADCE0]">
                        <button 
                            onClick={() => setActiveTab('brief')} 
                            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'brief' ? 'bg-[#202124] text-white shadow-md' : 'text-[#5F6368] hover:bg-white/50'}`}
                        >
                            <FileText size={14} /> Job Details
                        </button>
                        <button 
                            onClick={() => {
                                setActiveTab('strategy');
                                if (!analysis?.strategy) onGenerateKit(job);
                            }} 
                            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'strategy' ? 'bg-[#202124] text-white shadow-md' : 'text-[#5F6368] hover:bg-white/50'}`}
                        >
                            <Sparkles size={14} /> Strategy Kit
                        </button>
                    </div>

                    {activeTab === 'brief' ? (
                        <div className="prose prose-slate max-w-none text-[#202124]">
                            {/* Tags */}
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

                            <div className="mb-10">
                                <h3 className="text-sm font-bold text-[#202124] uppercase tracking-wide mb-4">Original Description</h3>
                                <div className="text-[#3C4043] leading-relaxed whitespace-pre-wrap text-base">
                                    {job.summary}
                                </div>
                            </div>
                            
                            {analysis && (
                                <div className="mt-8">
                                    <h4 className="text-sm font-black text-[#1967D2] mb-2 flex items-center gap-2 uppercase tracking-wide">
                                        <Zap size={16} className="fill-[#1967D2]" /> AI Summary
                                    </h4>
                                    <p className="text-[#202124] font-medium mb-6 leading-relaxed text-lg">{analysis.verdict}</p>
                                    
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

                {/* Sidebar (Right) - Unified Scroll, No Boxes */}
                <div className="w-full md:w-64 shrink-0 space-y-8 order-1 md:order-2">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F6368] mb-1 block">Status</span>
                        <span className={`text-lg font-bold ${job.status === 'applied' ? 'text-[#1a73e8]' : 'text-[#202124]'} capitalize`}>{job.status || 'New'}</span>
                    </div>

                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F6368] mb-1 block">Location</span>
                        <span className="text-sm font-semibold text-[#202124] block">{job.location}</span>
                    </div>

                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F6368] mb-1 block">Posted</span>
                        <span className="text-sm font-semibold text-[#202124] block">{job.postedDate || 'Recently'}</span>
                    </div>

                    {analysis && (
                         <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F6368] mb-1 block">Match Score</span>
                            <span className="text-4xl font-black text-[#1a73e8] block">{analysis.score}<span className="text-sm text-[#5F6368] ml-1 font-bold">/100</span></span>
                        </div>
                    )}

                    <div className="pt-4 border-t border-[#F1F3F4]">
                        <a href={applyUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-[#202124] text-white text-sm font-bold rounded-full hover:shadow-lg hover:bg-[#1a73e8] transition-all">
                            Apply on Site <ExternalLink size={16} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
