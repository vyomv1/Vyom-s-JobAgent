import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bold, Italic, List, BookOpen, Trash, Sparkles, CheckCircle2, Book, MessageCircle, HelpCircle, ChevronRight, Wand2, Layout, Maximize2, Minimize2, RotateCcw, RotateCw, Pin, AlertTriangle, X, Type, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, ListOrdered, Indent, Outdent, Heading1, Heading2, Heading3, Link as LinkIcon, Unlink, Minus, Plus, Eraser, Printer, Quote, MessageSquarePlus, ZoomIn, ZoomOut, ChevronDown, Highlighter, Image, Palette, PanelRightClose, PanelRightOpen, Menu } from 'lucide-react';
import { saveCV, getCV, saveJobCV } from '../services/firebase';
import { Job } from '../types';
import { USER_PROFILE } from '../constants';

interface CVEditorProps {
    targetJob?: Job | null;
    allJobs?: Job[]; 
}

const CVEditor: React.FC<CVEditorProps> = ({ targetJob, allJobs = [] }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fontSize, setFontSize] = useState(11);
  const [fontName, setFontName] = useState('Arial');
  const [foundKeywords, setFoundKeywords] = useState<Set<string>>(new Set());
  const [activeSidebarTab, setActiveSidebarTab] = useState<'strategy' | 'keywords' | 'snippets'>('strategy');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileScale, setMobileScale] = useState(1);
  
  const keywords = useMemo(() => targetJob?.analysis?.matchedKeywords || [], [targetJob]);

  // Handle Window Resize for Mobile Scaling
  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const paperWidth = 816 + 64; // Paper width + padding
            if (containerWidth < paperWidth) {
                setMobileScale((containerWidth - 32) / 816);
            } else {
                setMobileScale(1);
            }
        }
        // Auto-close sidebar on mobile
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
                <h1 style="font-size: 24pt; font-family: 'Arial', sans-serif; font-weight: 700; margin-bottom: 4pt; color: #000;">Vyom Pathroliya</h1>
                <p style="font-size: 11pt; font-family: 'Arial', sans-serif; margin-bottom: 12pt; color: #444;">Senior UX Designer • Edinburgh, UK • vyom@example.com</p>
                <h2 style="font-size: 14pt; font-family: 'Arial', sans-serif; font-weight: 700; border-bottom: 1px solid #ccc; padding-bottom: 4pt; margin-top: 16pt; margin-bottom: 8pt;">Experience</h2>
                <p style="font-size: 11pt; font-family: 'Arial', sans-serif;"><strong>Senior UX Designer</strong> | Intact Insurance</p>
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
    // CRITICAL: Restore focus to editor before executing command
    if (document.activeElement !== editorRef.current) {
        editorRef.current?.focus();
    }
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    saveContent();
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    execCmd('foreColor', e.target.value);
  };

  const triggerColorPicker = () => {
      colorInputRef.current?.click();
  };

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(6, fontSize + delta);
    setFontSize(newSize);
    
    // We use px for internal size, but execCommand 'fontSize' expects 1-7 int. 
    // Ideally we use CSS, but for simple compat we wrap selection in span
    if (editorRef.current) editorRef.current.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
         // Create a span with the exact font size
         const span = document.createElement('span');
         span.style.fontSize = `${newSize}pt`;
         
         const range = selection.getRangeAt(0);
         if (!range.collapsed) {
             range.surroundContents(span);
         } else {
             // If no text selected, just enable it for next typing (harder in raw HTML)
             // Fallback to execCommand for general sizing
             execCmd('fontSize', delta > 0 ? '3' : '2'); 
         }
         saveContent();
    }
  };

  const toggleFont = () => {
      const fonts = ['Arial', 'Times New Roman', 'Georgia', 'Courier New'];
      const currentIndex = fonts.indexOf(fontName);
      const nextFont = fonts[(currentIndex + 1) % fonts.length];
      setFontName(nextFont);
      execCmd('fontName', nextFont);
  };

  const insertSnippet = (content: string) => {
      if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand('insertHTML', false, `<p>${content}</p>`);
          saveContent();
          if (window.innerWidth < 768) setIsSidebarOpen(false); // Close drawer on mobile after insert
      }
  };

  // Improved ToolBtn with onMouseDown to prevent focus loss
  const ToolBtn = ({ icon: Icon, cmd, val, title, label, active, onClick }: { icon: any, cmd?: string, val?: string, title: string, label?: string, active?: boolean, onClick?: () => void }) => (
      <button 
        onMouseDown={(e) => {
            e.preventDefault(); // CRITICAL: Prevents button from stealing focus from contentEditable
            if (onClick) onClick();
            else if (cmd) execCmd(cmd, val);
        }}
        className={`p-2 rounded-md text-[#444746] dark:text-gray-300 transition-colors flex items-center justify-center gap-1 hover:bg-[#1d1d1f]/10 dark:hover:bg-white/10 ${active ? 'bg-[#d3e3fd] text-[#041e49]' : ''}`} 
        title={title}
        type="button"
      >
          <Icon size={18} strokeWidth={2} />
          {label && <span className="text-[12px] font-medium hidden sm:inline">{label}</span>}
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#F9FBFD] dark:bg-[#0C0C0C] relative w-full overflow-hidden">
        
        {/* TOOLBAR */}
        <div className="w-full sm:w-[98%] mx-auto sm:mt-2 bg-[#EDF2FA] dark:bg-[#1E1E1E] sm:rounded-full border-b sm:border border-black/5 dark:border-white/5 shadow-sm shrink-0 z-40">
             <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                
                {/* Mobile Menu Toggle */}
                {targetJob && (
                    <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                        className="md:hidden p-2 mr-2 rounded-md bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10"
                    >
                        <Menu size={18} className="text-gray-600 dark:text-gray-300" />
                    </button>
                )}

                <div className="flex items-center gap-1 pr-2 border-r border-[#c7c7c7] dark:border-gray-700">
                     <ToolBtn icon={RotateCcw} cmd="undo" title="Undo" />
                     <ToolBtn icon={RotateCw} cmd="redo" title="Redo" />
                </div>

                <div className="hidden sm:flex items-center gap-2 px-2 border-r border-[#c7c7c7] dark:border-gray-700">
                    <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setZoomLevel(z => z > 50 ? z - 25 : z)}
                        className="p-1 hover:bg-black/5 rounded"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-xs font-medium w-8 text-center">{zoomLevel}%</span>
                    <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setZoomLevel(z => z < 150 ? z + 25 : z)}
                        className="p-1 hover:bg-black/5 rounded"
                    >
                        <ZoomIn size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-2 px-2 border-r border-[#c7c7c7] dark:border-gray-700">
                    <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={toggleFont}
                        className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white dark:bg-[#2C2C2E] border border-transparent hover:border-gray-300 rounded text-xs font-medium w-28 truncate justify-between"
                        title="Change Font Family"
                    >
                        {fontName} <ChevronDown size={12}/>
                    </button>
                    <ToolBtn icon={Minus} onClick={() => changeFontSize(-1)} title="Smaller Text" />
                    <div className="hidden sm:block px-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#2C2C2E] rounded px-2 py-1 min-w-[24px] text-center">{fontSize}</div>
                    <ToolBtn icon={Plus} onClick={() => changeFontSize(1)} title="Larger Text" />
                </div>

                <div className="flex items-center gap-1 px-2 border-r border-[#c7c7c7] dark:border-gray-700">
                    <ToolBtn icon={Bold} cmd="bold" title="Bold" />
                    <ToolBtn icon={Italic} cmd="italic" title="Italic" />
                    <ToolBtn icon={Underline} cmd="underline" title="Underline" />
                    <div className="relative flex items-center">
                        <ToolBtn icon={Palette} onClick={triggerColorPicker} title="Text Color" />
                        <input 
                            ref={colorInputRef}
                            type="color" 
                            className="absolute opacity-0 w-0 h-0" 
                            onChange={handleColorChange}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1 px-2 border-r border-[#c7c7c7] dark:border-gray-700">
                    <ToolBtn icon={List} cmd="insertUnorderedList" title="Bullet List" />
                    <ToolBtn icon={ListOrdered} cmd="insertOrderedList" title="Number List" />
                </div>
             </div>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* SIDEBAR (Responsive) */}
            {targetJob && (
                <div className={`
                    absolute inset-y-0 left-0 z-50 w-[85%] sm:w-[300px] bg-white dark:bg-[#1E1E1E] border-r border-black/5 dark:border-white/5 flex flex-col transition-transform duration-300 shadow-2xl
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:relative md:translate-x-0 md:shadow-none
                `}>
                     <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                        <div className="flex gap-1 flex-1">
                            <button onClick={() => setActiveSidebarTab('strategy')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg ${activeSidebarTab === 'strategy' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Strategy</button>
                            <button onClick={() => setActiveSidebarTab('snippets')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg ${activeSidebarTab === 'snippets' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Snippets</button>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400"><X size={18}/></button>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                         {activeSidebarTab === 'strategy' && (
                            <div className="prose prose-sm text-xs text-gray-600 dark:text-gray-300">
                                {targetJob.analysis?.strategy ? (
                                    <div className="whitespace-pre-wrap">{targetJob.analysis.strategy}</div>
                                ) : (
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg text-center">
                                        <p>No AI strategy generated yet.</p>
                                    </div>
                                )}
                                
                                <div className="mt-6">
                                    <h4 className="font-bold mb-2 flex items-center gap-2"><Sparkles size={12}/> AI Keywords</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {keywords.map(kw => (
                                            <span key={kw} className={`text-[10px] px-2 py-1 rounded border ${foundKeywords.has(kw) ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 line-through opacity-50' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'}`}>{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                         )}
                         {activeSidebarTab === 'snippets' && (
                             <div className="space-y-3">
                                 {USER_PROFILE.caseStudies.map(cs => (
                                     <div key={cs.title} onClick={() => insertSnippet(cs.description)} className="p-3 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer text-xs transition-colors active:scale-95">
                                         <strong className="block mb-1 dark:text-white font-bold">{cs.title}</strong>
                                         <p className="line-clamp-3 text-gray-500 dark:text-gray-400 leading-relaxed">{cs.description}</p>
                                         <div className="mt-2 text-[10px] text-blue-500 font-bold flex items-center gap-1"><Plus size={10}/> Insert</div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                </div>
            )}

            {/* DOCUMENT CANVAS */}
            <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto bg-[#F9FBFD] dark:bg-[#0C0C0C] flex justify-center p-4 sm:p-8 custom-scrollbar relative touch-pan-y"
            >
                {/* THE PAPER */}
                <div 
                    className="origin-top transition-transform duration-200 shadow-2xl" 
                    style={{ 
                        transform: `scale(${mobileScale * (zoomLevel / 100)})`,
                        height: 'fit-content' 
                    }}
                >
                    <div 
                        ref={editorRef} 
                        contentEditable 
                        role="textbox" 
                        aria-multiline="true"
                        spellCheck="false"
                        className="bg-white text-black outline-none transition-all duration-300"
                        style={{
                            width: '816px', 
                            minHeight: '1056px',
                            padding: '96px', 
                            fontSize: '11pt',
                            lineHeight: '1.5',
                            fontFamily: 'Arial, sans-serif'
                        }}
                    />
                </div>
            </div>
            
            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && targetJob && (
                <div className="absolute inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}
        </div>
    </div>
  );
};

export default CVEditor;