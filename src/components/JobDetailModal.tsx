
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Briefcase, Zap, FileText, Sparkles, Edit2, Save, Check, ChevronDown } from 'lucide-react';
import { Job } from '../types';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onGenerateKit: (job: Job) => void;
  initialTab?: 'brief' | 'strategy';
  onUpdateJob?: (job: Job) => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ isOpen, onClose, job, onGenerateKit, initialTab = 'brief', onUpdateJob }) => {
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
  const applyUrl = job.url || `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}`;

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

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onUpdateJob) {
          onUpdateJob({ ...job, status: e.target.value as Job['status'] });
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Surface */}
      <div className="relative bg-[#F8F9FA] w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl rounded-[28px] overflow-hidden border border-white/50 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (Fixed) */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#DADCE0] shrink-0">
           <div className="flex items-center gap-5 flex-1 mr-8">
              <div className="w-14 h-14 bg-[#E8F0FE] text-[#1967D2] rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                  <Briefcase size={28} />
              </div>
              <div className="flex-1 min-w-0">
                  {isEditingTitle ? (
                      <input 
                        type="text" 
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                        className="text-2xl font-bold text-[#202124] w-full border-b-2 border-[#1a73e8] outline-none bg-transparent p-0"
                        autoFocus
                      />
                  ) : (
                      <h2 
                        onClick={() => setIsEditingTitle(true)}
                        className="text-2xl font-bold text-[#202124] leading-tight truncate cursor-pointer hover:text-[#1a73e8] transition-colors flex items-center gap-2 group w-full"
                        title="Click to edit title"
                      >
                        {job.title} <Edit2 size={16} className="opacity-0 group-hover:opacity-100 text-[#1a73e8] transition-opacity" />
                      </h2>
                  )}
                  
                  {isEditingCompany ? (
                      <input 
                        type="text" 
                        value={editedCompany}
                        onChange={(e) => setEditedCompany(e.target.value)}
                        onBlur={handleSaveCompany}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveCompany()}
                        className="text-sm text-[#5F6368] font-medium mt-1 w-full border-b border-[#1a73e8] outline-none bg-transparent p-0"
                        autoFocus
                      />
                  ) : (
                      <p 
                        onClick={() => setIsEditingCompany(true)}
                        className="text-sm text-[#5F6368] font-medium mt-1 truncate cursor-pointer hover:text-[#1a73e8] transition-colors flex items-center gap-2 group w-fit"
                        title="Click to edit company"
                      >
                          {job.company} <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-[#1a73e8] transition-opacity" />
                      </p>
                  )}
              </div>
           </div>
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-[#F1F3F4] rounded-full text-[#5F6368] transition-colors shrink-0">
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
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-[#202124] uppercase tracking-wide">Original Description</h3>
                                    {!isEditingSummary ? (
                                        <button 
                                            onClick={() => setIsEditingSummary(true)}
                                            className="text-xs font-bold text-[#1a73e8] hover:bg-[#E8F0FE] px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleSaveDescription}
                                            className="text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557B0] px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-sm"
                                        >
                                            <Save size={12} /> Save
                                        </button>
                                    )}
                                </div>
                                
                                {isEditingSummary ? (
                                    <textarea 
                                        value={editedSummary}
                                        onChange={(e) => setEditedSummary(e.target.value)}
                                        className="w-full h-[400px] p-4 border border-[#1a73e8] rounded-xl text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#D2E3FC] bg-white text-[#3C4043] font-sans resize-y"
                                        placeholder="Paste full job description here..."
                                    />
                                ) : (
                                    <div className="text-[#3C4043] leading-relaxed whitespace-pre-wrap text-base border border-transparent rounded-xl p-0.5">
                                        {job.summary}
                                    </div>
                                )}
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
                    <div className="relative">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F6368] mb-1 block">Status</span>
                        <div className="relative">
                            <select 
                                value={job.status || 'new'}
                                onChange={handleStatusChange}
                                className={`w-full appearance-none pl-4 pr-10 py-3 rounded-xl font-bold capitalize text-sm border focus:outline-none focus:ring-2 focus:ring-[#1a73e8] cursor-pointer transition-all ${
                                    job.status === 'applied' ? 'bg-[#E8F0FE] text-[#1967D2] border-[#D2E3FC]' :
                                    job.status === 'interview' ? 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]' :
                                    job.status === 'offer' ? 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]' :
                                    'bg-white text-[#202124] border-[#DADCE0]'
                                }`}
                            >
                                <option value="saved">Saved</option>
                                <option value="applied">Applied</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="archived">Archived</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
                    </div>

                    <div className="cursor-pointer group" onClick={() => setIsEditingLocation(true)}>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F6368] mb-1 block group-hover:text-[#1a73e8] transition-colors">Location</span>
                        {isEditingLocation ? (
                             <input 
                                type="text"
                                value={editedLocation}
                                onChange={(e) => setEditedLocation(e.target.value)}
                                onBlur={handleSaveLocation}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveLocation()}
                                className="text-sm font-semibold text-[#202124] block w-full border-b border-[#1a73e8] outline-none bg-transparent p-0"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                             />
                        ) : (
                             <span className="text-sm font-semibold text-[#202124] block group-hover:text-[#1a73e8] transition-colors flex items-center justify-between">
                                {job.location} <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-[#1a73e8]" />
                             </span>
                        )}
                    </div>

                    <div className="cursor-pointer group" onClick={() => setIsEditingPostedDate(true)}>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F6368] mb-1 block group-hover:text-[#1a73e8] transition-colors">Posted</span>
                         {isEditingPostedDate ? (
                             <input 
                                type="text"
                                value={editedPostedDate}
                                onChange={(e) => setEditedPostedDate(e.target.value)}
                                onBlur={handleSavePostedDate}
                                onKeyDown={(e) => e.key === 'Enter' && handleSavePostedDate()}
                                className="text-sm font-semibold text-[#202124] block w-full border-b border-[#1a73e8] outline-none bg-transparent p-0"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                             />
                        ) : (
                             <span className="text-sm font-semibold text-[#202124] block group-hover:text-[#1a73e8] transition-colors flex items-center justify-between">
                                {job.postedDate || 'Recently'} <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-[#1a73e8]" />
                             </span>
                        )}
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
