
import React, { useEffect, useState, useRef } from 'react';
import { X, ExternalLink, Briefcase, Zap, FileText, Sparkles, Edit2, Save, ChevronDown, RotateCw, TrendingUp, AlertTriangle, Loader2, Paperclip, Image as ImageIcon, Trash2, ChevronUp, Link as LinkIcon, Minus, Maximize2, MoreHorizontal } from 'lucide-react';
import { Job, Attachment } from '../types';

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
  
  // Description State
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

  // Notes & Attachments
  const notesRef = useRef<HTMLDivElement>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastJobIdRef = useRef<string>('');
  
  // Image Resizing State
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);

  // Re-Analyze State
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen, job]);

  // Sync local state with job prop
  useEffect(() => {
    if (job) {
        if (!isEditingSummary) setEditedSummary(job.summary || '');
        if (!isEditingTitle) setEditedTitle(job.title || '');
        if (!isEditingCompany) setEditedCompany(job.company || '');
        if (!isEditingLocation) setEditedLocation(job.location || '');
        if (!isEditingPostedDate) setEditedPostedDate(job.postedDate || '');
        if (!isEditingUrl) setEditedUrl(job.url === 'Manual Entry' ? '' : (job.url || ''));
        
        // Sync Notes to ContentEditable (Manual Sync to prevent cursor jumps)
        if (notesRef.current) {
            const isDifferentJob = lastJobIdRef.current !== job.id;
            
            // If it's a new job, always load the notes
            if (isDifferentJob) {
                notesRef.current.innerHTML = job.notes || '';
                lastJobIdRef.current = job.id;
                setSelectedImg(null); // Reset selection
            } 
            // If same job, only update if the content is different 
            // AND we are NOT currently editing/focused. 
            else {
                const isActive = document.activeElement === notesRef.current;
                if (!isActive && job.notes !== notesRef.current.innerHTML) {
                    notesRef.current.innerHTML = job.notes || '';
                }
            }
        }
    }
  }, [job, isEditingSummary, isEditingTitle, isEditingCompany, isEditingLocation, isEditingPostedDate, isEditingUrl]);

  // Auto-save Summary Debounce
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
      // Reset expanded state when opening a new job
      setIsDescriptionExpanded(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, job?.id]);

  if (!isOpen || !job) return null;

  const analysis = job.analysis;
  const attachments = job.attachments || [];
  
  const getAbsoluteUrl = (url?: string) => {
      if (!url || url === 'Manual Entry') return null;
      return url.startsWith('http') ? url : `https://${url}`;
  };

  const applyUrl = getAbsoluteUrl(job.url) || `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}`;

  // --- Handlers ---

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

  // --- Rich Text Notes Handlers ---

  const handleNotesUpdate = () => {
      if (notesRef.current && onUpdateJob) {
          const newNotes = notesRef.current.innerHTML;
          if (newNotes !== job.notes) {
              onUpdateJob({ ...job, notes: newNotes });
          }
      }
  };
  
  const handleNotesBlur = () => {
      setIsEditingNotes(false);
      handleNotesUpdate();
  };

  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 800; // Constrain width to reduce size
                  let width = img.width;
                  let height = img.height;

                  if (width > MAX_WIDTH) {
                      height = height * (MAX_WIDTH / width);
                      width = MAX_WIDTH;
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                      ctx.drawImage(img, 0, 0, width, height);
                      // Compress to JPEG with 0.7 quality
                      resolve(canvas.toDataURL('image/jpeg', 0.7));
                  } else {
                      reject(new Error('Canvas context failed'));
                  }
              };
              img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
      });
  };

  const handleNotesPaste = async (e: React.ClipboardEvent) => {
    // 1. Handle Images
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const blob = items[i].getAsFile();
            if (blob) {
                try {
                    const compressedDataUrl = await compressImage(blob);
                    const imgHtml = `<img src="${compressedDataUrl}" style="max-width: 100%; width: auto; border-radius: 8px; margin: 10px 0; display: block; cursor: pointer;" />`;
                    document.execCommand('insertHTML', false, imgHtml);
                    handleNotesUpdate();
                } catch (err) {
                    console.error("Image compression failed", err);
                }
            }
            return;
        }
    }

    // 2. Handle URL on Selection
    const pastedText = e.clipboardData.getData('text');
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
        // Simple URL regex
        const isUrl = /^(http|https):\/\/[^ "]+$/.test(pastedText);
        if (isUrl) {
            e.preventDefault();
            document.execCommand('createLink', false, pastedText);
            handleNotesUpdate();
            return;
        }
    }
  };

  // Image Resizing Logic
  const handleEditorClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
          setSelectedImg(target as HTMLImageElement);
      } else {
          // If the click is not on the toolbar, deselect the image
          const isToolbar = (e.target as HTMLElement).closest('.image-resize-toolbar');
          if (!isToolbar) {
            setSelectedImg(null);
          }
      }
      setIsEditingNotes(true);
  };

  const resizeImage = (percentage: string) => {
      if (selectedImg) {
          selectedImg.style.width = percentage;
          selectedImg.style.height = 'auto'; // Maintain aspect ratio
          handleNotesUpdate();
      }
  };

  // --- Attachments Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              const newAttachment: Attachment = {
                  id: Date.now().toString(),
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: event.target?.result as string
              };
              if (onUpdateJob) {
                  onUpdateJob({ ...job, attachments: [...(job.attachments || []), newAttachment] });
              }
          };
          reader.readAsDataURL(file);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAttachment = (id: string) => {
      if (onUpdateJob) {
          onUpdateJob({ ...job, attachments: (job.attachments || []).filter(a => a.id !== id) });
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
      <div className="relative bg-white dark:bg-[#1C1C1E] w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl rounded-[32px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-white/10 transition-colors">
        
        {/* Header - Minimalist */}
        <div className="flex items-start justify-between px-8 py-8 shrink-0 bg-white dark:bg-[#1C1C1E] z-10 transition-colors">
           <div className="flex-1 mr-8">
                {/* Title Editing */}
                {isEditingTitle ? (
                    <input 
                    type="text" 
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="text-3xl font-semibold text-[#1d1d1f] dark:text-white w-full outline-none bg-transparent p-0 border-b border-[#0071e3] dark:border-[#0A84FF]"
                    autoFocus
                    />
                ) : (
                    <h2 
                    onClick={() => setIsEditingTitle(true)}
                    className="text-3xl font-semibold text-[#1d1d1f] dark:text-white leading-tight cursor-pointer hover:text-[#0071e3] dark:hover:text-[#0A84FF] transition-colors"
                    >
                    {job.title}
                    </h2>
                )}
                
                {/* Company & Location Subtitle */}
                <div className="mt-2 flex items-center gap-2 text-lg text-[#86868b] dark:text-[#98989D] font-medium">
                    {isEditingCompany ? (
                        <input 
                            type="text" 
                            value={editedCompany}
                            onChange={(e) => setEditedCompany(e.target.value)}
                            onBlur={handleSaveCompany}
                            className="border-b border-[#0071e3] dark:border-[#0A84FF] outline-none bg-transparent w-40 text-[#1d1d1f] dark:text-white"
                        />
                    ) : (
                        <span onClick={() => setIsEditingCompany(true)} className="hover:text-[#0071e3] dark:hover:text-[#0A84FF] cursor-pointer transition-colors">{job.company}</span>
                    )}
                    <span>•</span>
                    <span>{job.location}</span>
                </div>
           </div>

           <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center bg-[#f5f5f7] dark:bg-[#2C2C2E] hover:bg-[#e8e8ed] dark:hover:bg-[#38383A] rounded-full text-[#1d1d1f] dark:text-white transition-colors"
           >
             <X size={20} />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-12">
            <div className="flex flex-col md:flex-row gap-12">
                
                {/* LEFT: Main Information */}
                <div className="flex-1 order-2 md:order-1 min-w-0">
                    
                    {/* Tabs Pill */}
                    <div className="flex items-center gap-1 mb-8 bg-[#f5f5f7] dark:bg-[#2C2C2E] p-1 rounded-full w-fit">
                        <button 
                            onClick={() => setActiveTab('brief')} 
                            className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${activeTab === 'brief' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm' : 'text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => {
                                setActiveTab('strategy');
                                if (!analysis?.strategy) onGenerateKit(job);
                            }} 
                            className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${activeTab === 'strategy' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm' : 'text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white'}`}
                        >
                            Strategy Kit
                        </button>
                    </div>

                    {activeTab === 'brief' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Chips */}
                            <div className="mb-8 flex flex-wrap gap-2">
                                {analysis && analysis.isHighValue && (
                                     <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#E6F4EA] dark:bg-[#1e3a29] text-[#1e8e3e] dark:text-[#45D469]">High Value</span>
                                )}
                                {isValidAttribute(analysis?.industry) && (
                                    <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#E8F2FF] dark:bg-[#122438] text-[#0071e3] dark:text-[#409CFF]">{analysis?.industry}</span>
                                )}
                                {isValidAttribute(job.seniorityScore) && (
                                    <span className="px-3 py-1 bg-[#f5f5f7] dark:bg-[#2C2C2E] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-full text-[12px] font-semibold">{job.seniorityScore}</span>
                                )}
                            </div>

                            {/* Verdict / AI Analysis Section */}
                            {analysis ? (
                                <div className="mb-8">
                                    <h4 className="text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-2">AI Analysis</h4>
                                    <p className="text-[18px] text-[#1d1d1f] dark:text-[#f5f5f7] font-medium leading-relaxed">{analysis.verdict}</p>
                                </div>
                            ) : (
                                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                    <div className="flex items-center gap-3 mb-3">
                                         <Loader2 className="text-[#0071e3] dark:text-[#0A84FF] animate-spin" size={20} />
                                         <span className="text-sm font-semibold text-[#0071e3] dark:text-[#0A84FF] animate-pulse">Analysing Opportunity...</span>
                                    </div>
                                    <div className="space-y-3 opacity-60">
                                        <div className="h-4 bg-[#0071e3]/10 dark:bg-[#0A84FF]/20 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-[#0071e3]/10 dark:bg-[#0A84FF]/20 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider">Job Description</h4>
                                    {!isEditingSummary ? (
                                        <button onClick={() => setIsEditingSummary(true)} className="text-[11px] font-bold text-[#0071e3] dark:text-[#0A84FF] hover:underline">Edit</button>
                                    ) : (
                                        <span className="text-[10px] text-[#86868b] dark:text-[#98989D] font-medium flex items-center gap-1">
                                            <Save size={10} /> Auto-saving...
                                        </span>
                                    )}
                                </div>
                                
                                {isEditingSummary ? (
                                    <div className="relative">
                                        <textarea 
                                            value={editedSummary}
                                            onChange={(e) => setEditedSummary(e.target.value)}
                                            className="w-full h-[400px] p-4 border border-[#0071e3] dark:border-[#0A84FF] rounded-xl text-[15px] leading-relaxed focus:outline-none bg-white dark:bg-[#2C2C2E] dark:text-[#f5f5f7] font-sans resize-y"
                                            autoFocus
                                        />
                                        <button 
                                            onClick={handleSaveDescription} 
                                            className="absolute bottom-4 right-4 bg-[#0071e3] text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:scale-105 transition-transform shadow-md"
                                        >
                                            Done
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className={`text-[#424245] dark:text-[#B0B0B5] text-[15px] leading-relaxed whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-custom' : ''}`}>
                                            {job.summary || <span className="text-gray-400 italic">No description available.</span>}
                                        </div>
                                        {(job.summary && job.summary.length > 300) && (
                                            <button 
                                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                                className="mt-2 text-[12px] font-bold text-[#0071e3] dark:text-[#0A84FF] flex items-center gap-1 hover:underline"
                                            >
                                                {isDescriptionExpanded ? (
                                                    <>Show Less <ChevronUp size={12} /></>
                                                ) : (
                                                    <>Read More <ChevronDown size={12} /></>
                                                )}
                                            </button>
                                        )}
                                        {/* CSS for line clamp logic */}
                                        <style>{`
                                            .line-clamp-custom {
                                                display: -webkit-box;
                                                -webkit-line-clamp: 10;
                                                -webkit-box-orient: vertical;
                                                overflow: hidden;
                                            }
                                        `}</style>
                                    </div>
                                )}
                            </div>

                            {/* Attachments Section */}
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-3">
                                     <h4 className="text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider">Attachments</h4>
                                     <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-[11px] font-bold text-[#0071e3] dark:text-[#0A84FF] flex items-center gap-1 hover:underline"
                                     >
                                        <Paperclip size={12} /> Add File
                                     </button>
                                     <input 
                                        type="file" 
                                        multiple
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileUpload}
                                     />
                                </div>
                                {attachments.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {attachments.map((file) => (
                                            <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f7] dark:bg-[#2C2C2E] border border-transparent hover:border-[#d2d2d7] dark:hover:border-[#38383A] transition-colors group">
                                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-black/20 flex items-center justify-center text-[#86868b] dark:text-[#98989D]">
                                                    {file.type.includes('image') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white truncate">{file.name}</p>
                                                    <p className="text-[11px] text-[#86868b] dark:text-[#98989D]">{(file.size / 1024).toFixed(0)} KB</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteAttachment(file.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-[#86868b] hover:text-[#FF3B30] transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 border border-dashed border-[#d2d2d7] dark:border-[#38383A] rounded-xl text-center">
                                        <p className="text-[12px] text-[#86868b] dark:text-[#98989D]">No attachments yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Notes Section - Rich Text */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider">Notes</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-[#86868b] dark:text-[#98989D] hidden sm:inline">Paste images (Cmd+V) supported</span>
                                    </div>
                                </div>
                                
                                <div 
                                    className={`relative rounded-xl border transition-all overflow-visible bg-white dark:bg-[#2C2C2E] ${isEditingNotes ? 'border-[#0071e3] ring-1 ring-[#0071e3] dark:border-[#0A84FF] dark:ring-[#0A84FF]' : 'border-[#d2d2d7] dark:border-[#38383A]'}`}
                                >
                                    {/* Image Resize Toolbar */}
                                    {selectedImg && (
                                        <div className="image-resize-toolbar absolute -top-10 right-0 bg-[#1d1d1f] text-white rounded-lg flex items-center p-1 gap-1 z-20 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => resizeImage('25%')} className="px-2 py-1 text-[10px] font-bold hover:bg-white/20 rounded transition-colors">25%</button>
                                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => resizeImage('50%')} className="px-2 py-1 text-[10px] font-bold hover:bg-white/20 rounded transition-colors">50%</button>
                                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => resizeImage('75%')} className="px-2 py-1 text-[10px] font-bold hover:bg-white/20 rounded transition-colors">75%</button>
                                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => resizeImage('100%')} className="px-2 py-1 text-[10px] font-bold hover:bg-white/20 rounded transition-colors">100%</button>
                                            <div className="w-px h-3 bg-white/20 mx-1"></div>
                                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => setSelectedImg(null)} className="px-2 py-1 text-[10px] hover:bg-white/20 rounded transition-colors"><X size={10} /></button>
                                        </div>
                                    )}

                                    <div
                                        ref={notesRef}
                                        contentEditable
                                        onFocus={() => setIsEditingNotes(true)}
                                        onBlur={handleNotesBlur}
                                        onInput={handleNotesUpdate}
                                        onPaste={handleNotesPaste}
                                        onClick={handleEditorClick}
                                        className="min-h-[150px] p-4 text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] outline-none prose dark:prose-invert max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                                        data-placeholder="Type your notes here... Paste images or select text to link."
                                    />
                                    
                                    {/* Mini Toolbar */}
                                    <div className="px-3 py-2 bg-[#f5f5f7] dark:bg-[#1C1C1E]/50 border-t border-[#d2d2d7] dark:border-[#38383A] flex items-center gap-2 rounded-b-xl">
                                         <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#86868b] dark:text-[#98989D] font-bold text-xs transition-colors">B</button>
                                         <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#86868b] dark:text-[#98989D] italic text-xs transition-colors">I</button>
                                         <div className="w-px h-3 bg-[#d2d2d7] dark:bg-[#38383A] mx-1"></div>
                                         <span className="text-[10px] text-[#86868b] dark:text-[#98989D]">Select text & paste URL to link</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[20px] font-bold text-[#1d1d1f] dark:text-white">Strategy Kit</h3>
                                <button onClick={() => onGenerateKit(job)} className="text-[13px] font-medium text-[#0071e3] dark:text-[#0A84FF] hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] px-4 py-2 rounded-full transition-colors flex items-center gap-2">
                                    <Sparkles size={16} /> Regenerate
                                </button>
                            </div>
                            
                            {analysis?.strategy ? (
                                <div className="prose prose-p:text-[#424245] dark:prose-p:text-[#B0B0B5] prose-headings:text-[#1d1d1f] dark:prose-headings:text-white max-w-none">
                                    <div className="whitespace-pre-wrap leading-relaxed">{analysis.strategy}</div>
                                </div>
                            ) : (
                                <div className="py-20 text-center text-[#86868b] dark:text-[#98989D]">
                                    <Sparkles size={40} className="mx-auto mb-4 animate-pulse text-[#0071e3] dark:text-[#0A84FF]" />
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
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] dark:text-[#98989D] mb-2 block">Status</label>
                        <div className="relative">
                            <select 
                                value={job.status || 'new'}
                                onChange={handleStatusChange}
                                className="w-full appearance-none pl-4 pr-10 py-3 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl font-semibold text-[14px] text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF] cursor-pointer"
                            >
                                <option value="saved">Saved</option>
                                <option value="applied">Applied</option>
                                <option value="assessment">Assessment</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="archived">Archived</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868b] dark:text-[#98989D]" />
                        </div>
                    </div>

                    {/* Match Score */}
                     <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] dark:text-[#98989D]">Match Score</span>
                            <button onClick={handleReAnalyzeClick} className={`text-[#0071e3] dark:text-[#0A84FF] hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] p-1.5 rounded-full transition-all ${isAnalyzing ? 'animate-spin' : ''}`}>
                                <RotateCw size={14} />
                            </button>
                        </div>
                        {analysis ? (
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">{analysis.score}</span>
                                <span className="text-lg text-[#86868b] dark:text-[#98989D] font-medium mb-1">/100</span>
                            </div>
                        ) : (
                            <div className="h-12 w-24 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded animate-pulse"></div>
                        )}
                    </div>

                    <div className="w-full h-px bg-[#f5f5f7] dark:bg-[#38383A]"></div>

                    {/* Meta Data */}
                    <div className="space-y-4">
                        <div onClick={() => setIsEditingLocation(true)} className="cursor-pointer group">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] dark:text-[#98989D] mb-1 block">Location</span>
                            {isEditingLocation ? (
                                <input value={editedLocation} onChange={e => setEditedLocation(e.target.value)} onBlur={handleSaveLocation} className="text-[14px] font-medium text-[#1d1d1f] dark:text-white border-b border-[#0071e3] dark:border-[#0A84FF] outline-none w-full bg-transparent" autoFocus />
                            ) : (
                                <p className="text-[14px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] group-hover:text-[#0071e3] dark:group-hover:text-[#0A84FF] transition-colors flex items-center justify-between">
                                    {job.location} <Edit2 size={12} className="opacity-0 group-hover:opacity-100" />
                                </p>
                            )}
                        </div>
                        
                        <div onClick={() => setIsEditingPostedDate(true)} className="cursor-pointer group">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] dark:text-[#98989D] mb-1 block">Posted</span>
                            {isEditingPostedDate ? (
                                <input value={editedPostedDate} onChange={e => setEditedPostedDate(e.target.value)} onBlur={handleSavePostedDate} className="text-[14px] font-medium text-[#1d1d1f] dark:text-white border-b border-[#0071e3] dark:border-[#0A84FF] outline-none w-full bg-transparent" autoFocus />
                            ) : (
                                <p className="text-[14px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] group-hover:text-[#0071e3] dark:group-hover:text-[#0A84FF] transition-colors flex items-center justify-between">
                                    {job.postedDate || 'Unknown'} <Edit2 size={12} className="opacity-0 group-hover:opacity-100" />
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="w-full h-px bg-[#f5f5f7] dark:bg-[#38383A]"></div>

                    {/* URL & Apply */}
                    <div>
                         <div className="flex items-center justify-between mb-3">
                             <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] dark:text-[#98989D]">Link</span>
                             <button onClick={() => setIsEditingUrl(!isEditingUrl)} className="text-[#0071e3] dark:text-[#0A84FF] hover:underline text-[10px] font-bold">Edit</button>
                         </div>
                         
                         {isEditingUrl && (
                            <input 
                                type="text"
                                value={editedUrl}
                                onChange={(e) => setEditedUrl(e.target.value)}
                                onBlur={handleSaveUrl}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
                                className="text-[13px] text-[#1d1d1f] dark:text-white w-full p-2 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-lg mb-3 outline-none"
                                autoFocus
                                placeholder="https://..."
                            />
                         )}

                        <a 
                            href={applyUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#0071e3] dark:bg-[#0A84FF] text-white text-[14px] font-semibold rounded-full hover:bg-[#0077ED] dark:hover:bg-[#409CFF] transition-all shadow-md shadow-blue-500/20 dark:shadow-blue-900/20"
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
