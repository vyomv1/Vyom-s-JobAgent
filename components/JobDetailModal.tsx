import React, { useEffect, useState, useRef } from 'react';
import { X, ExternalLink, Briefcase, Zap, FileText, Sparkles, Edit2, Save, ChevronDown, RotateCw, TrendingUp, AlertTriangle, Loader2, Paperclip, Image as ImageIcon, Trash2, ChevronUp, Link as LinkIcon, Info, Check, Calendar, CalendarCheck, Video, Phone } from 'lucide-react';
import { Job, Attachment } from '../types';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onGenerateKit: (job: Job) => void;
  initialTab?: 'brief' | 'strategy';
  onUpdateJob?: (job: Job) => void;
  onReAnalyze?: (job: Job) => Promise<void>;
  onTailorResume?: (id: string) => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ isOpen, onClose, job, onGenerateKit, initialTab = 'brief', onUpdateJob, onReAnalyze, onTailorResume }) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'strategy' | 'manage'>('brief');
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  
  // Edit States
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editedCompany, setEditedCompany] = useState('');

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editedLocation, setEditedLocation] = useState('');

  const [isEditingPostedDate, setIsEditingPostedDate] = useState(false);
  const [editedPostedDate, setEditedPostedDate] = useState('');

  const notesRef = useRef<HTMLDivElement>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false); 
  const lastJobIdRef = useRef<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen, job]);

  useEffect(() => {
    if (job) {
        if (!isEditingSummary) setEditedSummary(job.summary || '');
        if (!isEditingTitle) setEditedTitle(job.title || '');
        if (!isEditingCompany) setEditedCompany(job.company || '');
        if (!isEditingLocation) setEditedLocation(job.location || '');
        if (!isEditingPostedDate) setEditedPostedDate(job.postedDate || '');
        
        if (notesRef.current) {
            const isDifferentJob = lastJobIdRef.current !== job.id;
            if (isDifferentJob) {
                notesRef.current.innerHTML = job.notes || '';
                lastJobIdRef.current = job.id;
            } 
            else {
                const isActive = document.activeElement === notesRef.current;
                if (!isActive && job.notes !== notesRef.current.innerHTML) {
                    notesRef.current.innerHTML = job.notes || '';
                }
            }
        }
    }
  }, [job, isEditingSummary, isEditingTitle, isEditingCompany, isEditingLocation, isEditingPostedDate]);

  useEffect(() => {
      const timer = setTimeout(() => {
          if (isEditingSummary && onUpdateJob && job && editedSummary !== job.summary) {
              onUpdateJob({ ...job, summary: editedSummary });
          }
      }, 1000); 
      return () => clearTimeout(timer);
  }, [editedSummary, isEditingSummary, job, onUpdateJob]);

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
  const applyUrl = job.url && job.url !== 'Manual Entry' ? (job.url.startsWith('http') ? job.url : `https://${job.url}`) : `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}`;
  const showStageNotes = ['assessment', 'interview', 'offer'].includes(job.status || '');

  // Handlers
  const handleSaveTitle = () => { if (onUpdateJob && editedTitle.trim() !== job.title) onUpdateJob({ ...job, title: editedTitle }); setIsEditingTitle(false); };
  const handleSaveCompany = () => { if (onUpdateJob && editedCompany.trim() !== job.company) onUpdateJob({ ...job, company: editedCompany }); setIsEditingCompany(false); };
  const handleSaveLocation = () => { if (onUpdateJob && editedLocation.trim() !== job.location) onUpdateJob({ ...job, location: editedLocation }); setIsEditingLocation(false); };
  const handleSavePostedDate = () => { if (onUpdateJob && editedPostedDate.trim() !== job.postedDate) onUpdateJob({ ...job, postedDate: editedPostedDate }); setIsEditingPostedDate(false); };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => { if (onUpdateJob) onUpdateJob({ ...job, status: e.target.value as Job['status'] }); };
  const handleReAnalyzeClick = async () => { if (onReAnalyze) { setIsAnalyzing(true); await onReAnalyze(job); setIsAnalyzing(false); } };
  const handleGenerateKitClick = async () => { setIsGeneratingKit(true); await onGenerateKit(job); setIsGeneratingKit(false); };
  const handleNotesUpdate = () => { if (notesRef.current && onUpdateJob) { const newNotes = notesRef.current.innerHTML; if (newNotes !== job.notes) onUpdateJob({ ...job, notes: newNotes }); } };
  const handleStageNotesUpdate = (e: React.ChangeEvent<HTMLTextAreaElement>) => { if (onUpdateJob) onUpdateJob({ ...job, stageNotes: e.target.value }); };
  const handleNotesBlur = () => { setIsEditingNotes(false); handleNotesUpdate(); };
  
  const handleInterviewDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = new Date(e.target.value);
      if (onUpdateJob && !isNaN(date.getTime())) {
          onUpdateJob({ ...job, interviewDate: date.getTime() });
      } else if (onUpdateJob && e.target.value === '') {
          onUpdateJob({ ...job, interviewDate: undefined });
      }
  };

  const handleFormatChange = (format: 'video' | 'phone') => {
    if (onUpdateJob) onUpdateJob({ ...job, interviewFormat: format });
  };

  const getGoogleCalendarUrl = () => {
    if (!job.interviewDate) return '';
    const start = new Date(job.interviewDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration
    const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const title = encodeURIComponent(`Interview: ${job.title} at ${job.company}`);
    const details = encodeURIComponent(`Role: ${job.title}\nCompany: ${job.company}\nFormat: ${job.interviewFormat || 'Not specified'}\n\nStage Notes:\n${job.stageNotes || ''}\n\nNotes:\n${job.notes || ''}`);
    const location = encodeURIComponent(job.location);
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${format(start)}/${format(end)}`;
  };

  const handleNotesPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const blob = items[i].getAsFile();
            if (blob) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const imgHtml = `<img src="${ev.target?.result}" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />`;
                    document.execCommand('insertHTML', false, imgHtml);
                    handleNotesUpdate();
                };
                reader.readAsDataURL(blob);
            }
            return;
        }
    }
  };

  const interviewDateValue = job.interviewDate 
    ? new Date(job.interviewDate - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) 
    : '';

  // Render the management controls (Status, Interview, Resume)
  const renderManagementPanel = () => (
      <div className="flex flex-col gap-6 h-full">
          <div className="space-y-6 pt-0">
              <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Date Posted</span>
                   {isEditingPostedDate ? (
                      <input 
                          value={editedPostedDate} 
                          onChange={(e) => setEditedPostedDate(e.target.value)} 
                          onBlur={handleSavePostedDate} 
                          onKeyDown={(e) => e.key === 'Enter' && handleSavePostedDate()}
                          className="font-medium text-sm text-apple-text dark:text-white bg-transparent border-b border-apple-blue outline-none w-full" 
                          autoFocus 
                      />
                   ) : (
                      <p onClick={() => setIsEditingPostedDate(true)} className="font-medium text-sm text-apple-text dark:text-white cursor-pointer hover:text-apple-blue transition-colors">
                          {job.postedDate || 'Unknown'}
                      </p>
                   )}
              </div>
              <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Full Location</span>
                   {isEditingLocation ? (
                      <input 
                          value={editedLocation} 
                          onChange={(e) => setEditedLocation(e.target.value)} 
                          onBlur={handleSaveLocation} 
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveLocation()}
                          className="font-medium text-sm text-apple-text dark:text-white bg-transparent border-b border-apple-blue outline-none w-full" 
                          autoFocus 
                      />
                   ) : (
                      <p onClick={() => setIsEditingLocation(true)} className="font-medium text-sm text-apple-text dark:text-white cursor-pointer hover:text-apple-blue transition-colors">
                          {job.location}
                      </p>
                   )}
              </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] p-1 rounded-2xl shadow-sm border border-gray-200 dark:border-white/5 mt-2">
              <div className="p-4 border-b border-gray-100 dark:border-white/5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Current Status</label>
                  <div className="relative">
                      <select value={job.status || 'new'} onChange={handleStatusChange} className="w-full appearance-none bg-gray-50 dark:bg-black/20 px-4 py-3 rounded-xl font-bold text-sm text-apple-text dark:text-white cursor-pointer outline-none">
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="assessment">Assessment</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="archived">Archived</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                   <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Match Score</span>
                      <span className={`text-2xl font-bold tracking-tight ${analysis?.score >= 80 ? 'text-green-600' : 'text-apple-text dark:text-white'}`}>{analysis?.score || 0}%</span>
                   </div>
                   <button onClick={handleReAnalyzeClick} className={`p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-apple-blue ${isAnalyzing ? 'animate-spin' : ''}`}>
                      <RotateCw size={16} />
                   </button>
              </div>
          </div>

          <button onClick={() => onTailorResume?.(job.id)} className="w-full py-4 bg-apple-text dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2">
              <Sparkles size={16} /> Open Resume Studio
          </button>
          
          <div className="space-y-3">
               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Interview Schedule</span>
               <div className="relative">
                   <input 
                      type="datetime-local" 
                      value={interviewDateValue}
                      onChange={handleInterviewDateChange}
                      className="w-full px-4 py-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-apple-text dark:text-white outline-none focus:ring-2 focus:ring-apple-blue"
                   />
                   <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
               </div>

               {job.interviewDate && (
                   <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Format</span>
                        <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
                            <button 
                                onClick={() => handleFormatChange('video')} 
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${job.interviewFormat === 'video' || (!job.interviewFormat && job.location.toLowerCase().includes('remote')) ? 'bg-white dark:bg-[#2C2C2E] text-apple-blue shadow-sm' : 'text-gray-500 hover:text-apple-text dark:hover:text-white'}`}
                            >
                                <Video size={14} /> Video
                            </button>
                            <button 
                                onClick={() => handleFormatChange('phone')} 
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${job.interviewFormat === 'phone' ? 'bg-white dark:bg-[#2C2C2E] text-apple-blue shadow-sm' : 'text-gray-500 hover:text-apple-text dark:hover:text-white'}`}
                            >
                                <Phone size={14} /> Phone
                            </button>
                        </div>
                   </div>
               )}

               {job.interviewDate && (
                   <a 
                       href={getGoogleCalendarUrl()} 
                       target="_blank" 
                       rel="noreferrer"
                       className="w-full py-2.5 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-apple-text dark:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                   >
                       <CalendarCheck size={14} /> Add to Google Calendar
                   </a>
               )}
          </div>
          
          <div className="mt-auto pt-6 border-t border-gray-200 dark:border-white/5 md:block hidden">
              <a href={applyUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-apple-blue/10 text-apple-blue text-sm font-bold rounded-xl">
                  Visit Listing <ExternalLink size={14} />
              </a>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-[#1C1C1E] w-full max-w-6xl h-full sm:h-[92vh] flex flex-col shadow-2xl sm:rounded-[24px] overflow-hidden animate-in zoom-in-95 duration-300 border border-transparent dark:border-white/10 ring-1 ring-black/5">
        
        {/* Header - Fixed on Mobile/Desktop */}
        <div className="flex flex-col shrink-0 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-xl z-20">
           <div className="flex items-start justify-between px-6 sm:px-8 py-5 sm:py-8">
               <div className="flex-1 pr-4 sm:pr-6">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                         <div className="flex items-center gap-2">
                             {isEditingCompany ? (
                                <input 
                                    value={editedCompany} 
                                    onChange={(e) => setEditedCompany(e.target.value)} 
                                    onBlur={handleSaveCompany} 
                                    className="text-sm sm:text-lg font-medium text-gray-500 bg-transparent border-b border-apple-blue outline-none max-w-[120px] sm:max-w-none" 
                                    autoFocus 
                                />
                             ) : (
                                <button onClick={() => setIsEditingCompany(true)} className="text-sm sm:text-lg font-medium text-gray-500 hover:text-apple-blue cursor-pointer transition-colors flex items-center gap-2 text-left truncate max-w-[120px] sm:max-w-none">
                                    {job.company}
                                </button>
                             )}
                         </div>
                    </div>

                    {isEditingTitle ? (
                        <input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onBlur={handleSaveTitle} onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()} className="text-lg sm:text-3xl font-bold tracking-tight text-apple-text dark:text-white w-full outline-none bg-transparent p-0 border-b-2 border-apple-blue" autoFocus />
                    ) : (
                        <h2 onClick={() => setIsEditingTitle(true)} className="text-lg sm:text-3xl font-bold tracking-tight text-apple-text dark:text-white leading-tight cursor-pointer hover:text-apple-blue transition-colors line-clamp-2">{job.title}</h2>
                    )}
               </div>
               <button onClick={onClose} className="w-10 h-10 shrink-0 flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full transition-colors text-apple-text dark:text-white"><X size={20} /></button>
           </div>
        </div>

        {/* Unified Scroll Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#1C1C1E]">
            <div className="flex flex-col md:flex-row min-h-full">
                
                {/* Left Column: Description Area */}
                <div className={`flex-1 p-6 sm:p-8 md:p-10 ${activeTab === 'manage' ? 'hidden md:block' : 'block'}`}>
                    
                    {/* Tabs */}
                    <div className="flex items-center gap-1 mb-6 sm:mb-8 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-full sm:w-fit border border-gray-200 dark:border-white/5">
                        <button onClick={() => setActiveTab('brief')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'brief' ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>Overview</button>
                        <button onClick={() => { setActiveTab('strategy'); if (!analysis?.strategy) handleGenerateKitClick(); }} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'strategy' ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>Strategy</button>
                        
                        {/* Mobile Only Manage Tab */}
                        <button onClick={() => setActiveTab('manage')} className={`md:hidden flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'manage' ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>Manage</button>
                    </div>

                    {activeTab === 'brief' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8 pb-12">
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                {analysis?.isHighValue && <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-100 dark:border-emerald-800">High Priority</span>}
                                {job.seniorityScore && <span className="px-2.5 py-1 bg-gray-50 dark:bg-white/5 rounded-md text-[10px] font-bold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/5">{job.seniorityScore} Level</span>}
                                <span className="px-2.5 py-1 bg-gray-50 dark:bg-white/5 rounded-md text-[10px] font-bold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/5">{job.source}</span>
                            </div>

                            {/* Verdict */}
                            {analysis ? (
                                <div className="bg-gray-50 dark:bg-white/5 p-5 sm:p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Sparkles size={10} className="text-apple-blue"/> Strategic Verdict</h4>
                                    <p className="text-sm sm:text-xl text-apple-text dark:text-white font-medium leading-relaxed">{analysis.verdict}</p>
                                </div>
                            ) : (
                                 <div className="p-5 sm:p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex items-center gap-3">
                                    <Loader2 className="text-apple-blue animate-spin" size={18} />
                                    <span className="text-xs sm:text-sm font-semibold text-apple-blue">Analyzing opportunity potential...</span>
                                 </div>
                            )}
                            
                            {/* Stage Notes */}
                            {showStageNotes && (
                                 <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                                     <h4 className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                         <Zap size={12} /> Active Stage Notes
                                     </h4>
                                     <textarea
                                         value={job.stageNotes || ''}
                                         onChange={handleStageNotesUpdate}
                                         placeholder="Track interview prep, questions to ask, or offer details here..."
                                         className="w-full min-h-[100px] bg-white dark:bg-[#2C2C2E] rounded-xl p-3 text-sm text-apple-text dark:text-white outline-none border border-purple-100 dark:border-purple-800/30 focus:border-purple-400 transition-colors"
                                     />
                                 </div>
                            )}

                            {/* Summary */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role Description</h4>
                                    <button onClick={() => setIsEditingSummary(!isEditingSummary)} className="text-[10px] font-bold text-apple-blue flex items-center gap-1">
                                        {isEditingSummary ? <Check size={12}/> : <Edit2 size={12}/>} {isEditingSummary ? 'Save' : 'Edit'}
                                    </button>
                                </div>
                                {isEditingSummary ? (
                                    <textarea value={editedSummary} onChange={(e) => setEditedSummary(e.target.value)} className="w-full h-80 p-4 border-2 border-apple-blue rounded-xl text-sm leading-relaxed outline-none dark:bg-[#2C2C2E] dark:text-white" autoFocus />
                                ) : (
                                    <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">{job.summary}</div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Private Notes</h4>
                                <div className={`rounded-xl border bg-white dark:bg-[#2C2C2E] overflow-hidden ${isEditingNotes ? 'border-apple-blue' : 'border-gray-200 dark:border-white/10'}`}>
                                    <div ref={notesRef} contentEditable onFocus={() => setIsEditingNotes(true)} onBlur={handleNotesBlur} onInput={handleNotesUpdate} onPaste={handleNotesPaste} className="min-h-[120px] p-4 text-sm outline-none prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300" data-placeholder="Add thoughts..." role="textbox" />
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'strategy' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
                             {isGeneratingKit ? (
                                <div className="flex flex-col items-center justify-center h-48 text-center space-y-4">
                                    <Loader2 size={32} className="text-apple-blue animate-spin"/>
                                    <p className="text-xs font-medium text-gray-500">Formulating application strategy...</p>
                                </div>
                            ) : (
                                <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-li:marker:text-apple-blue text-gray-600 dark:text-gray-300">
                                    <div className="whitespace-pre-wrap">{analysis?.strategy || "Strategy formulation failed."}</div>
                                </article>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Mobile Management Panel (Shown when activeTab is manage) */}
                <div className={`p-6 bg-gray-50 dark:bg-black/50 ${activeTab === 'manage' ? 'block md:hidden' : 'hidden'}`}>
                    {renderManagementPanel()}
                </div>

                {/* Desktop Right Column (Hidden on mobile, always visible on desktop) */}
                <div className="hidden md:flex w-[320px] bg-gray-50 dark:bg-[#111] border-l border-gray-200 dark:border-white/5 p-8 flex-col gap-8 shrink-0">
                    {renderManagementPanel()}
                </div>
            </div>
            
            {/* Mobile Footer Actions (Only shown in Brief/Strategy tabs) */}
            {activeTab !== 'manage' && (
                <div className="md:hidden flex gap-2 p-4 pb-6 bg-white dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/10 shrink-0 z-30 sticky bottom-0">
                    <a href={applyUrl} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-apple-blue text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                        Visit Listing <ExternalLink size={14} />
                    </a>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;