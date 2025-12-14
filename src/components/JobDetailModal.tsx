
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Briefcase, Zap, FileText, Sparkles, Edit2, Save, ChevronDown, RotateCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { Job } from '../types';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onGenerateKit: (job: Job) => void;
  initialTab?: 'brief' | 'strategy';
  onUpdateJob?: (job: Job) => void;
  onReAnalyze?: (job: Job) => Promise<void>;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ isOpen, onClose, job, onGenerateKit, initialTab = 'brief', onUpdateJob, onReAnalyze }) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'strategy'>(initialTab);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  
  // Title Editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // Company Editing
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editedCompany, setEditedCompany] = useState('');

  // Location Editing
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editedLocation, setEditedLocation] = useState('');

  // Posted Date Editing
  const [isEditingPostedDate, setIsEditingPostedDate] = useState(false);
  const [editedPostedDate, setEditedPostedDate] = useState('');

  // URL Editing
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editedUrl, setEditedUrl] = useState('');

  // Re-Analyze State
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen, job]);

  useEffect(() => {
    if (job) {
        setEditedSummary(job.summary || '');
        setEditedTitle(job.title || '');
        setEditedCompany(job.company || '');
        setEditedLocation(job.location || '');
        setEditedPostedDate(job.postedDate || '');
        setEditedUrl(job.url === 'Manual Entry' ? '' : (job.url || ''));
    }
  }, [job]);

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
  
  const getAbsoluteUrl = (url?: string) => {
      if (!url || url === 'Manual Entry') return null;
      return url.startsWith('http') ? url : `https://${url}`;
  };

  const applyUrl = getAbsoluteUrl(job.url) || `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}`;

  const handleSaveDescription = () => {
      if (onUpdateJob) {
          onUpdateJob({ ...job, summary: editedSummary });
          setIsEditingSummary(false);
      }
  };

  const handleSaveTitle = () => {
      if (onUpdateJob && editedTitle.trim() !== job.title) {
          onUpdateJob({ ...job, title: editedTitle });
      }
      setIsEditingTitle(false);
  };

  const handleSaveCompany = () => {
      if (onUpdateJob && editedCompany.trim() !== job.company) {
          onUpdateJob({ ...job, company: editedCompany });
      }
      setIsEditingCompany(false);
  };

  const handleSaveLocation = () => {
      if (onUpdateJob && editedLocation.trim() !== job.location) {
          onUpdateJob({ ...job, location: editedLocation });
      }
      setIsEditingLocation(false);
  };

  const handleSavePostedDate = () => {
      if (onUpdateJob && editedPostedDate.trim() !== job.postedDate) {
          onUpdateJob({ ...job, postedDate: editedPostedDate });
      }
      setIsEditingPostedDate(false);
  };

  const handleSaveUrl = () => {
      if (onUpdateJob && editedUrl.trim() !== job.url) {
          const finalUrl = editedUrl.trim() || 'Manual Entry';
          onUpdateJob({ ...job, url: finalUrl });
      }
      setIsEditingUrl(false);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onUpdateJob) {
          onUpdateJob({ ...job, status: e.target.value as Job['status'] });
      }
  };

  const handleReAnalyzeClick = async () => {
      if (onReAnalyze) {
          setIsAnalyzing(true);
          await onReAnalyze(job);
          setIsAnalyzing(false);
      }
  };

  const isValidAttribute = (attr?: string) => {
      if (!attr) return false;
      const lower = attr.toLowerCase();
      return lower !== 'unspecified' && lower !== 'unknown' && lower !== 'n/a' && attr.trim() !== '';
  };

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
        role="dialog"
        aria-modal="true"
    >
      {/* Darkened Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Surface - Clean Apple Style */}
      <div className="relative bg-white w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl rounded-[32px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Minimalist */}
        <div className="flex items-start justify-between px-8 py-8 shrink-0 bg-white z-10">
           <div className="flex-1 mr-8">
                {/* Title Editing */}
                {isEditingTitle ? (
                    <input 
                    type="text" 
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="text-3xl font-semibold text-[#1d1d1f] w-full outline-none bg-transparent p-0 border-b border-[#0071e3]"
                    autoFocus
                    />
                ) : (
                    <h2 
                    onClick={() => setIsEditingTitle(true)}
                    className="text-3xl font-semibold text-[#1d1d1f] leading-tight cursor-pointer hover:text-[#0071e3] transition-colors"
                    >
                    {job.title}
                    </h2>
                )}
                
                {/* Company & Location Subtitle */}
                <div className="mt-2 flex items-center gap-2 text-lg text-[#86868b] font-medium">
                    {isEditingCompany ? (
                        <input 
                            type="text" 
                            value={editedCompany}
                            onChange={(e) => setEditedCompany(e.target.value)}
                            onBlur={handleSaveCompany}
                            className="border-b border-[#0071e3] outline-none bg-transparent w-40"
                        />
                    ) : (
                        <span onClick={() => setIsEditingCompany(true)} className="hover:text-[#0071e3] cursor-pointer transition-colors">{job.company}</span>
                    )}
                    <span>•</span>
                    <span>{job.location}</span>
                </div>
           </div>

           <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full text-[#1d1d1f] transition-colors"
           >
             <X size={20} />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-12">
            <div className="flex flex-col md:flex-row gap-12">
                
                {/* LEFT: Main Information */}
                <div className="flex-1 order-2 md:order-1">
                    
                    {/* Tabs Pill */}
                    <div className="flex items-center gap-1 mb-8 bg-[#f5f5f7] p-1 rounded-full w-fit">
                        <button 
                            onClick={() => setActiveTab('brief')} 
                            className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${activeTab === 'brief' ? 'bg-white text-black shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => {
                                setActiveTab('strategy');
                                if (!analysis?.strategy) onGenerateKit(job);
                            }} 
                            className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${activeTab === 'strategy' ? 'bg-white text-black shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                        >
                            Strategy Kit
                        </button>
                    </div>

                    {activeTab === 'brief' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Chips */}
                            <div className="mb-8 flex flex-wrap gap-2">
                                {analysis && analysis.isHighValue && (
                                     <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#E6F4EA] text-[#1e8e3e]">High Value</span>
                                )}
                                {isValidAttribute(analysis?.industry) && (
                                    <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#E8F2FF] text-[#0071e3]">{analysis?.industry}</span>
                                )}
                                {isValidAttribute(job.seniorityScore) && (
                                    <span className="px-3 py-1 bg-[#f5f5f7] text-[#1d1d1f] rounded-full text-[12px] font-semibold">{job.seniorityScore}</span>
                                )}
                            </div>

                            {/* Verdict */}
                            {analysis && (
                                <div className="mb-8">
                                    <h4 className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-2">AI Analysis</h4>
                                    <p className="text-[18px] text-[#1d1d1f] font-medium leading-relaxed">{analysis.verdict}</p>
                                </div>
                            )}

                            {/* Description */}
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Job Description</h4>
                                    {!isEditingSummary ? (
                                        <button onClick={() => setIsEditingSummary(true)} className="text-[11px] font-bold text-[#0071e3] hover:underline">Edit</button>
                                    ) : (
                                        <button onClick={handleSaveDescription} className="text-[11px] font-bold text-[#0071e3] hover:underline">Done</button>
                                    )}
                                </div>
                                
                                {isEditingSummary ? (
                                    <textarea 
                                        value={editedSummary}
                                        onChange={(e) => setEditedSummary(e.target.value)}
                                        className="w-full h-[400px] p-4 border border-[#0071e3] rounded-xl text-[15px] leading-relaxed focus:outline-none bg-white font-sans resize-y"
                                    />
                                ) : (
                                    <div className="text-[#424245] text-[15px] leading-relaxed whitespace-pre-wrap">
                                        {job.summary}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[20px] font-bold text-[#1d1d1f]">Strategy Kit</h3>
                                <button onClick={() => onGenerateKit(job)} className="text-[13px] font-medium text-[#0071e3] hover:bg-[#f5f5f7] px-4 py-2 rounded-full transition-colors flex items-center gap-2">
                                    <Sparkles size={16} /> Regenerate
                                </button>
                            </div>
                            
                            {analysis?.strategy ? (
                                <div className="prose prose-p:text-[#424245] prose-headings:text-[#1d1d1f] max-w-none">
                                    <div className="whitespace-pre-wrap leading-relaxed">{analysis.strategy}</div>
                                </div>
                            ) : (
                                <div className="py-20 text-center text-[#86868b]">
                                    <Sparkles size={40} className="mx-auto mb-4 animate-pulse text-[#0071e3]" />
                                    <p className="font-medium">Formulating your custom strategy...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: Properties Panel */}
                <div className="w-full md:w-72 shrink-0 space-y-8 order-1 md:order-2">
                    {/* Status Dropdown */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] mb-2 block">Status</label>
                        <div className="relative">
                            <select 
                                value={job.status || 'new'}
                                onChange={handleStatusChange}
                                className="w-full appearance-none pl-4 pr-10 py-3 bg-[#f5f5f7] rounded-xl font-semibold text-[14px] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3] cursor-pointer"
                            >
                                <option value="saved">Saved</option>
                                <option value="applied">Applied</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="archived">Archived</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868b]" />
                        </div>
                    </div>

                    {/* Match Score */}
                    {analysis && (
                         <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Match Score</span>
                                <button onClick={handleReAnalyzeClick} className={`text-[#0071e3] hover:bg-[#f5f5f7] p-1.5 rounded-full transition-all ${isAnalyzing ? 'animate-spin' : ''}`}>
                                    <RotateCw size={14} />
                                </button>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-semibold text-[#1d1d1f] tracking-tight">{analysis.score}</span>
                                <span className="text-lg text-[#86868b] font-medium mb-1">/100</span>
                            </div>
                        </div>
                    )}

                    <div className="w-full h-px bg-[#f5f5f7]"></div>

                    {/* Meta Data */}
                    <div className="space-y-4">
                        <div onClick={() => setIsEditingLocation(true)} className="cursor-pointer group">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] mb-1 block">Location</span>
                            {isEditingLocation ? (
                                <input value={editedLocation} onChange={e => setEditedLocation(e.target.value)} onBlur={handleSaveLocation} className="text-[14px] font-medium text-[#1d1d1f] border-b border-[#0071e3] outline-none w-full" autoFocus />
                            ) : (
                                <p className="text-[14px] font-medium text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors flex items-center justify-between">
                                    {job.location} <Edit2 size={12} className="opacity-0 group-hover:opacity-100" />
                                </p>
                            )}
                        </div>
                        
                        <div onClick={() => setIsEditingPostedDate(true)} className="cursor-pointer group">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] mb-1 block">Posted</span>
                            {isEditingPostedDate ? (
                                <input value={editedPostedDate} onChange={e => setEditedPostedDate(e.target.value)} onBlur={handleSavePostedDate} className="text-[14px] font-medium text-[#1d1d1f] border-b border-[#0071e3] outline-none w-full" autoFocus />
                            ) : (
                                <p className="text-[14px] font-medium text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors flex items-center justify-between">
                                    {job.postedDate || 'Unknown'} <Edit2 size={12} className="opacity-0 group-hover:opacity-100" />
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="w-full h-px bg-[#f5f5f7]"></div>

                    {/* URL & Apply */}
                    <div>
                         <div className="flex items-center justify-between mb-3">
                             <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">Link</span>
                             <button onClick={() => setIsEditingUrl(!isEditingUrl)} className="text-[#0071e3] hover:underline text-[10px] font-bold">Edit</button>
                         </div>
                         
                         {isEditingUrl && (
                            <input 
                                type="text"
                                value={editedUrl}
                                onChange={(e) => setEditedUrl(e.target.value)}
                                onBlur={handleSaveUrl}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
                                className="text-[13px] text-[#1d1d1f] w-full p-2 bg-[#f5f5f7] rounded-lg mb-3 outline-none"
                                autoFocus
                                placeholder="https://..."
                            />
                         )}

                        <a 
                            href={applyUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#0071e3] text-white text-[14px] font-semibold rounded-full hover:bg-[#0077ED] transition-all shadow-md shadow-blue-500/20"
                        >
                            {getAbsoluteUrl(job.url) ? 'Apply Now' : 'Google Search'} <ExternalLink size={16} />
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
