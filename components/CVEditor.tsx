import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bold, Italic, List, BookOpen, Trash, Sparkles, CheckCircle2, Book, MessageCircle, HelpCircle, ChevronRight, Wand2, Layout, Maximize2, Minimize2, RotateCcw, RotateCw, Pin, AlertTriangle, X, Type, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, ListOrdered, Indent, Outdent, Heading1, Heading2, Heading3, Link as LinkIcon, Unlink, Minus, Eraser, Printer, Quote } from 'lucide-react';
import { saveCV, getCV, saveJobCV } from '../services/firebase';
import { Job } from '../types';
import { USER_PROFILE } from '../constants';

interface CVEditorProps {
    targetJob?: Job | null;
    allJobs?: Job[]; // Passed for the Market Altimeter
}

const CVEditor: React.FC<CVEditorProps> = ({ targetJob, allJobs = [] }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [showDoc, setShowDoc] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [foundKeywords, setFoundKeywords] = useState<Set<string>>(new Set());
  const [activeSidebarTab, setActiveSidebarTab] = useState<'strategy' | 'keywords' | 'snippets' | 'interview'>('strategy');
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  
  // SURGICAL PINS (Surgeon Ergonomics)
  // Allows pinning strategy items to the editor view to prevent context switching
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);

  const keywords = useMemo(() => targetJob?.analysis?.matchedKeywords || [], [targetJob]);

  // MARKET ALTIMETER (Aviation Situational Awareness)
  // Alerts user of high-value opportunities while they are heads-down in the editor
  const highValueOpportunityCount = useMemo(() => {
      return allJobs.filter(j => (j.analysis?.score || 0) > 85 && j.status === 'new').length;
  }, [allJobs]);

  const scanKeywords = useCallback(() => {
    if (!editorRef.current || keywords.length === 0) return;
    const text = editorRef.current.innerText.toLowerCase();
    const found = new Set<string>();
    keywords.forEach(kw => {
        if (text.toLowerCase().includes(kw.toLowerCase())) found.add(kw);
    });
    setFoundKeywords(found);
  }, [keywords]);

  useEffect(() => {
    const loadContent = async () => {
        let content = "";
        if (targetJob) {
            content = targetJob.tailoredCv || await getCV();
        } else {
            content = await getCV();
        }

        if (editorRef.current) {
            editorRef.current.innerHTML = content || `
                <h1 style="font-size: 2.2em; font-weight: 800; margin-bottom: 0.2em; color: #1d1d1f; letter-spacing: -0.02em;">Senior UX Designer</h1>
                <p style="color: #86868b; font-size: 1.1em; margin-bottom: 2em; font-weight: 500;">Strategic and human-centered Senior UX Designer with 7+ years of experience transforming complex financial and insurance problems into intuitive digital solutions.</p>
                <h2 style="font-size: 1.4em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.8em; border-bottom: 2px solid #f5f5f7; padding-bottom: 0.3em;">Experience</h2>
            `;
            setLastSaved('Ready');
            scanKeywords();
        }
    };
    loadContent();
  }, [targetJob?.id, scanKeywords]);

  const saveContent = useCallback(async () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (targetJob) {
        await saveJobCV(targetJob.id, html);
    } else {
        await saveCV(html);
    }
    const now = new Date();
    setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    scanKeywords();
  }, [targetJob, scanKeywords]);

  useEffect(() => {
      const handleInput = () => {
          const timeoutId = setTimeout(() => saveContent(), 1000);
          return () => clearTimeout(timeoutId);
      };
      const el = editorRef.current;
      el?.addEventListener('input', handleInput);
      return () => el?.removeEventListener('input', handleInput);
  }, [saveContent]);

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    saveContent();
  };

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) execCmd('createLink', url);
  }, []);

  const handlePrint = useCallback(() => {
    if(!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if(printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Resume - ${targetJob ? targetJob.company : 'Vyom Pathroliya'}</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; color: #1d1d1f; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
                        a { color: #0071e3; text-decoration: none; }
                        h1, h2, h3, h4 { color: #000; margin-top: 1.5em; margin-bottom: 0.5em; }
                        ul { padding-left: 1.2em; }
                        /* Ensure A4 page breaks if possible */
                        @media print {
                            body { padding: 0; }
                            @page { margin: 2cm; }
                        }
                    </style>
                </head>
                <body>${content}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        // Optional: printWindow.close();
    }
  }, [targetJob]);

  const insertSnippet = (content: string) => {
      if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand('insertHTML', false, `<p>${content}</p>`);
          saveContent();
      }
  };

  const togglePin = (content: string) => {
      setPinnedItems(prev => {
          if (prev.includes(content)) return prev.filter(p => p !== content);
          return [...prev, content];
      });
  };

  const keywordProgress = keywords.length > 0 ? (foundKeywords.size / keywords.length) * 100 : 0;
  const interviewQuestions = useMemo(() => {
      if (!targetJob?.analysis?.strategy) return ["How do you approach Design Systems?", "Describe your accessibility workflow.", "How do you handle stakeholder pushback?"];
      return targetJob.analysis.strategy.match(/\?.*$/gm) || ["Walk us through your Trove case study.", "How did you optimize compliance workflows at Intact?", "What is your UX philosophy?"];
  }, [targetJob]);

  const ToolBtn = ({ icon: Icon, cmd, val, title, label }: { icon: any, cmd: string, val?: string, title: string, label?: string }) => (
      <button onClick={() => execCmd(cmd, val)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-[#1d1d1f] dark:text-white transition-colors flex items-center gap-1" title={title}>
          <Icon size={16} />
          {label && <span className="text-[10px] font-bold">{label}</span>}
      </button>
  );

  return (
    <div className={`flex h-full gap-8 mx-auto relative px-6 pb-6 transition-all duration-500 ease-out ${isZenMode ? 'w-full max-w-none' : 'max-w-none w-full'}`}>
        
        {/* MARKET ALTIMETER (Aviation) */}
        {highValueOpportunityCount > 0 && (
            <div className="absolute top-0 right-6 -mt-16 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse cursor-pointer z-50 shadow-lg border border-white/10 hover:bg-black transition-colors">
                <AlertTriangle size={12} className="text-yellow-400" />
                MARKET ALERT: {highValueOpportunityCount} New High-Value Targets Detected
            </div>
        )}

        {/* WAR ROOM SIDEBAR */}
        {targetJob && !isZenMode && (
            <div className="w-[400px] shrink-0 flex flex-col gap-6 animate-in slide-in-from-left-12 duration-500 h-full">
                <div className="flex bg-[#E8E8ED] dark:bg-white/10 p-1.5 rounded-2xl w-full shrink-0">
                    <button onClick={() => setActiveSidebarTab('strategy')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all ${activeSidebarTab === 'strategy' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm font-medium' : 'text-[#86868b] hover:text-black dark:hover:text-white'}`} title="Strategy"><Sparkles size={18} /></button>
                    <button onClick={() => setActiveSidebarTab('keywords')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all ${activeSidebarTab === 'keywords' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm font-medium' : 'text-[#86868b] hover:text-black dark:hover:text-white'}`} title="Keywords"><Layout size={18} /></button>
                    <button onClick={() => setActiveSidebarTab('snippets')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all ${activeSidebarTab === 'snippets' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm font-medium' : 'text-[#86868b] hover:text-black dark:hover:text-white'}`} title="Snippets"><Book size={18} /></button>
                    <button onClick={() => setActiveSidebarTab('interview')} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all ${activeSidebarTab === 'interview' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm font-medium' : 'text-[#86868b] hover:text-black dark:hover:text-white'}`} title="Interview Prep"><MessageCircle size={18} /></button>
                </div>

                <div className="flex-1 overflow-hidden bg-white dark:bg-[#1C1C1E] rounded-[32px] border border-black/5 dark:border-white/10 flex flex-col shadow-sm">
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                        
                        {activeSidebarTab === 'strategy' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#86868b] mb-4">Live Strategy</h3>
                                <div className="prose prose-sm dark:prose-invert text-[14px] leading-relaxed whitespace-pre-wrap text-[#1d1d1f] dark:text-[#f5f5f7]">
                                    {targetJob.analysis?.strategy || "Generating custom strategy..."}
                                </div>
                                <div className="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-white/10">
                                    <button onClick={() => togglePin(targetJob.analysis?.verdict || "Focus on Value")} className="w-full py-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"><Pin size={14}/> Pin Verdict to Editor</button>
                                </div>
                            </div>
                        )}

                        {activeSidebarTab === 'keywords' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#86868b]">Keyword Gap</h3>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${keywordProgress >= 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{foundKeywords.size}/{keywords.length} Found</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full mb-6 overflow-hidden">
                                    <div className="h-full bg-[#0071e3] transition-all duration-1000 ease-out" style={{ width: `${keywordProgress}%` }}></div>
                                </div>
                                <div className="space-y-2">
                                    {keywords.map(kw => {
                                        const isFound = foundKeywords.has(kw);
                                        return (
                                            <div key={kw} className={`group p-3 rounded-xl border transition-all flex items-center justify-between ${isFound ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-gray-50 dark:bg-white/5 border-transparent text-[#1d1d1f] dark:text-white opacity-60'}`}>
                                                <span className="text-xs font-semibold">{kw}</span>
                                                {isFound ? <CheckCircle2 size={14} /> : <Wand2 size={14} className="opacity-0 group-hover:opacity-40" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeSidebarTab === 'snippets' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#86868b] mb-4">Case Studies</h3>
                                <div className="space-y-4">
                                    {USER_PROFILE.caseStudies.map((cs, i) => (
                                        <div key={i} className="group relative">
                                            <div onClick={() => insertSnippet(`${cs.title}: ${cs.description}`)} className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-[#2C2C2E] hover:shadow-lg hover:scale-[1.02] border border-transparent hover:border-black/5 transition-all cursor-pointer">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#0071e3] mb-2">{cs.title}</p>
                                                <p className="text-sm leading-snug text-[#1d1d1f] dark:text-white">{cs.description}</p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); togglePin(`${cs.title}: ${cs.description}`); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-white dark:bg-black shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-[#86868b] hover:text-[#0071e3]"><Pin size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSidebarTab === 'interview' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col h-full">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#86868b] mb-6">Prep Mode</h3>
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-[24px] p-8 text-white flex flex-col shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                                        <HelpCircle className="opacity-30 mb-auto" size={32} />
                                        <p className="text-xl font-bold leading-tight text-center mb-6">
                                            {interviewQuestions[currentFlashcard]}
                                        </p>
                                        <div className="mt-auto flex justify-center gap-2">
                                            {interviewQuestions.map((_, i) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${currentFlashcard === i ? 'bg-white scale-150' : 'bg-white/30'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setCurrentFlashcard((currentFlashcard + 1) % interviewQuestions.length)}
                                        className="mt-8 px-6 py-3 bg-white dark:bg-[#2C2C2E] rounded-full text-sm font-bold text-[#1d1d1f] dark:text-white hover:shadow-lg transition-all flex items-center gap-2"
                                    >
                                        Next Question <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        )}

        {/* EDITOR AREA with SURGICAL OVERLAYS */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#111] rounded-[32px] shadow-sm overflow-hidden border border-black/5 dark:border-white/10 relative h-full">
            
            {/* FLOATING PINNED ITEMS (Surgeon) */}
            {pinnedItems.length > 0 && (
                <div className="absolute top-24 right-8 w-72 flex flex-col gap-3 z-30 pointer-events-none">
                    {pinnedItems.map((item, i) => (
                        <div key={i} className="pointer-events-auto bg-[#FFF8C5] dark:bg-yellow-900/30 dark:text-yellow-100 p-4 rounded-xl shadow-xl border border-yellow-300/50 dark:border-yellow-500/20 text-[13px] leading-relaxed animate-in slide-in-from-right-8 fade-in duration-300 relative group backdrop-blur-sm">
                            <button onClick={() => togglePin(item)} className="absolute -top-2 -right-2 bg-white dark:bg-black rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-black/5 hover:scale-110"><X size={12}/></button>
                            {item}
                        </div>
                    ))}
                </div>
            )}

            {/* Formatting Toolbar */}
            <div className="h-14 shrink-0 border-b border-black/5 dark:border-white/5 flex items-center px-6 justify-between bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-linear-fade pr-4">
                    {targetJob && (
                        <button onClick={() => setIsZenMode(!isZenMode)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-[#86868b] transition-all mr-2" title={isZenMode ? "Exit Zen Mode" : "Zen Mode"}>
                            {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                    )}
                    
                    <div className="flex items-center gap-0.5 bg-gray-100/50 dark:bg-white/5 p-1 rounded-lg">
                        <ToolBtn icon={RotateCcw} cmd="undo" title="Undo" />
                        <ToolBtn icon={RotateCw} cmd="redo" title="Redo" />
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2"></div>

                    <div className="flex items-center gap-0.5">
                        <ToolBtn icon={Type} cmd="fontName" val="Arial" title="Sans Serif" label="Sans" />
                        <ToolBtn icon={Quote} cmd="fontName" val="Georgia" title="Serif" label="Serif" />
                    </div>
                    
                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2"></div>

                    <div className="flex items-center gap-0.5">
                        <ToolBtn icon={Heading1} cmd="formatBlock" val="H1" title="Heading 1" />
                        <ToolBtn icon={Heading2} cmd="formatBlock" val="H2" title="Heading 2" />
                        <ToolBtn icon={Heading3} cmd="formatBlock" val="H3" title="Heading 3" />
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2"></div>

                    <div className="flex items-center gap-0.5">
                        <ToolBtn icon={Bold} cmd="bold" title="Bold" />
                        <ToolBtn icon={Italic} cmd="italic" title="Italic" />
                        <ToolBtn icon={Underline} cmd="underline" title="Underline" />
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2"></div>

                    <div className="flex items-center gap-0.5">
                        <ToolBtn icon={AlignLeft} cmd="justifyLeft" title="Align Left" />
                        <ToolBtn icon={AlignCenter} cmd="justifyCenter" title="Align Center" />
                        <ToolBtn icon={AlignRight} cmd="justifyRight" title="Align Right" />
                        <ToolBtn icon={AlignJustify} cmd="justifyFull" title="Justify" />
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2"></div>

                    <div className="flex items-center gap-0.5">
                        <ToolBtn icon={List} cmd="insertUnorderedList" title="Bullet List" />
                        <ToolBtn icon={ListOrdered} cmd="insertOrderedList" title="Numbered List" />
                        <ToolBtn icon={Indent} cmd="indent" title="Indent" />
                        <ToolBtn icon={Outdent} cmd="outdent" title="Outdent" />
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2"></div>

                    <div className="flex items-center gap-0.5">
                        <button onClick={insertLink} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-[#1d1d1f] dark:text-white transition-colors" title="Insert Link"><LinkIcon size={16} /></button>
                        <ToolBtn icon={Unlink} cmd="unlink" title="Unlink" />
                        <ToolBtn icon={Minus} cmd="insertHorizontalRule" title="Divider" />
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2"></div>

                    <ToolBtn icon={Eraser} cmd="removeFormat" title="Clear Formatting" />
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button onClick={handlePrint} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-[#1d1d1f] dark:text-white transition-colors flex items-center gap-2" title="Print/Export PDF">
                        <Printer size={16} /> <span className="text-xs font-bold hidden sm:inline">Print</span>
                    </button>
                    <button onClick={() => setShowDoc(!showDoc)} className={`h-8 px-4 rounded-full transition-all flex items-center gap-2 text-[12px] font-bold ${showDoc ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-black shadow-lg' : 'bg-gray-100 dark:bg-white/10 text-[#1d1d1f] dark:text-white'}`}>
                        <BookOpen size={14} /> Ref CV
                    </button>
                    <div className="text-[10px] font-bold text-[#86868b] bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-black/5 dark:border-white/5 tabular-nums">
                        {lastSaved || 'Unsaved'}
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-[#F5F5F7] dark:bg-[#000] flex relative custom-scrollbar">
                {showDoc && (
                    <div className="w-1/2 h-full border-r border-black/5 dark:border-white/10 bg-white dark:bg-[#1C1C1E] hidden lg:block animate-in slide-in-from-left-8 duration-500 ease-out z-10 shadow-2xl sticky top-0">
                        <iframe src="https://docs.google.com/document/d/1RcERxf9--nMGdxXTHAt4q35yynk39Aqk31AqSuG02G4/preview" className="w-full h-full border-none" title="Reference CV"></iframe>
                    </div>
                )}
                <div className={`flex-1 flex justify-center p-12 transition-all duration-500 ${showDoc || targetJob ? 'bg-gray-100 dark:bg-[#000]' : ''}`}>
                     <div 
                        ref={editorRef} 
                        contentEditable 
                        role="textbox" 
                        aria-multiline="true" 
                        className={`w-full h-max min-h-[1100px] bg-white text-[#1d1d1f] shadow-2xl p-[80px] outline-none font-sans text-[11pt] leading-[1.6] transition-all duration-300 rounded-sm mb-32 ${isZenMode ? 'max-w-[1000px]' : (showDoc || targetJob ? 'max-w-full' : 'max-w-[850px]')}`}
                     />
                </div>
            </div>
        </div>
    </div>
  );
};

export default CVEditor;