import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bold, Italic, List, BookOpen, Trash, Sparkles, CheckCircle2, Book, MessageCircle, HelpCircle, ChevronRight, Wand2, Layout, Maximize2, Minimize2, RotateCcw, RotateCw, Pin, AlertTriangle, X, Type, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, ListOrdered, Indent, Outdent, Heading1, Heading2, Heading3, Link as LinkIcon, Unlink, Minus, Plus, Eraser, Printer, Quote, MessageSquarePlus, ZoomIn, ZoomOut, ChevronDown, Highlighter, Image, Palette } from 'lucide-react';
import { saveCV, getCV, saveJobCV } from '../services/firebase';
import { Job } from '../types';
import { USER_PROFILE } from '../constants';

interface CVEditorProps {
    targetJob?: Job | null;
    allJobs?: Job[]; 
}

const CVEditor: React.FC<CVEditorProps> = ({ targetJob, allJobs = [] }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fontSize, setFontSize] = useState(11);
  const [foundKeywords, setFoundKeywords] = useState<Set<string>>(new Set());
  const [activeSidebarTab, setActiveSidebarTab] = useState<'strategy' | 'keywords' | 'snippets'>('strategy');
  
  const keywords = useMemo(() => targetJob?.analysis?.matchedKeywords || [], [targetJob]);

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
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    saveContent();
  };

  const handleColor = (command: string) => {
    const color = prompt('Enter a hex color (e.g., #ff0000) or name:');
    if (color) execCmd(command, color);
  };

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(6, fontSize + delta);
    setFontSize(newSize);
    // document.execCommand with fontSize is limited (1-7), so we wrap selection in a span
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = `${newSize}pt`;
        range.surroundContents(span);
        saveContent();
    }
  };

  const handleFontFamily = (font: string) => {
    execCmd('fontName', font);
  };

  const handleComment = () => {
     execCmd('backColor', '#fff0b3'); 
  };

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) execCmd('createLink', url);
  }, []);

  const insertSnippet = (content: string) => {
      if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand('insertHTML', false, `<p>${content}</p>`);
          saveContent();
      }
  };

  const ToolBtn = ({ icon: Icon, cmd, val, title, label, active, onClick }: { icon: any, cmd?: string, val?: string, title: string, label?: string, active?: boolean, onClick?: () => void }) => (
      <button 
        onClick={() => {
            if (onClick) onClick();
            else if (cmd) execCmd(cmd, val);
        }} 
        className={`p-1.5 rounded-[4px] text-[#444746] dark:text-gray-300 transition-colors flex items-center gap-1 hover:bg-[#1d1d1f]/5 dark:hover:bg-white/10 ${active ? 'bg-[#d3e3fd] text-[#041e49]' : ''}`} 
        title={title}
      >
          <Icon size={18} strokeWidth={2} />
          {label && <span className="text-[12px] font-medium">{label}</span>}
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#F9FBFD] dark:bg-[#0C0C0C] relative w-full overflow-hidden">
        
        {/* GOOGLE DOCS STYLE TOOLBAR */}
        <div className="w-[98%] mx-auto mt-2 bg-[#EDF2FA] dark:bg-[#1E1E1E] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm shrink-0 z-40 overflow-x-auto no-scrollbar border border-black/5 dark:border-white/5">
            
            <div className="flex items-center gap-1 pr-2 border-r border-[#c7c7c7] dark:border-gray-700">
                 <ToolBtn icon={RotateCcw} cmd="undo" title="Undo" />
                 <ToolBtn icon={RotateCw} cmd="redo" title="Redo" />
                 <ToolBtn icon={Printer} onClick={() => window.print()} title="Print" />
                 <ToolBtn icon={Eraser} cmd="removeFormat" title="Clear Formatting" />
            </div>

            <div className="flex items-center gap-2 px-2 border-r border-[#c7c7c7] dark:border-gray-700">
                <div className="flex items-center bg-white dark:bg-[#2C2C2E] rounded-md px-2 py-1 cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200">
                    <select 
                        value={zoomLevel} 
                        onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                        className="bg-transparent text-xs font-medium text-gray-600 dark:text-gray-300 outline-none cursor-pointer"
                    >
                        <option value="50">50%</option>
                        <option value="75">75%</option>
                        <option value="100">100%</option>
                        <option value="125">125%</option>
                        <option value="150">150%</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2 px-2 border-r border-[#c7c7c7] dark:border-gray-700">
                <div className="flex items-center bg-white dark:bg-[#2C2C2E] rounded-md px-2 py-1 cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200 w-24">
                    <select 
                        onChange={(e) => handleFontFamily(e.target.value)}
                        className="bg-transparent text-xs font-medium text-gray-600 dark:text-gray-300 outline-none cursor-pointer w-full"
                    >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times</option>
                        <option value="Courier New">Courier</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                    </select>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <ToolBtn icon={Minus} onClick={() => changeFontSize(-1)} title="Decrease Font Size" />
                <div className="px-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-[#2C2C2E] rounded px-2 py-1 min-w-[24px] text-center">{fontSize}</div>
                <ToolBtn icon={Plus} onClick={() => changeFontSize(1)} title="Increase Font Size" />
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-[#c7c7c7] dark:border-gray-700">
                <ToolBtn icon={Bold} cmd="bold" title="Bold" />
                <ToolBtn icon={Italic} cmd="italic" title="Italic" />
                <ToolBtn icon={Underline} cmd="underline" title="Underline" />
                <ToolBtn icon={Palette} onClick={() => handleColor('foreColor')} title="Text Color" />
                <ToolBtn icon={Highlighter} onClick={() => handleColor('backColor')} title="Highlight Color" />
            </div>

            <div className="flex items-center gap-1 px-2 border-r border-[#c7c7c7] dark:border-gray-700">
                <ToolBtn icon={LinkIcon} onClick={insertLink} title="Insert Link" />
                <ToolBtn icon={MessageSquarePlus} onClick={handleComment} title="Add Comment" />
                <ToolBtn icon={Image} title="Insert Image" />
            </div>

            <div className="flex items-center gap-1 px-2">
                 <ToolBtn icon={AlignLeft} cmd="justifyLeft" title="Align Left" />
                 <ToolBtn icon={AlignCenter} cmd="justifyCenter" title="Align Center" />
                 <ToolBtn icon={AlignRight} cmd="justifyRight" title="Align Right" />
                 <ToolBtn icon={AlignJustify} cmd="justifyFull" title="Justify" />
                 <div className="w-px h-4 bg-gray-300 ml-1"></div>
                 <ToolBtn icon={List} cmd="insertUnorderedList" title="Bullet List" />
                 <ToolBtn icon={ListOrdered} cmd="insertOrderedList" title="Numbered List" />
                 <ToolBtn icon={Indent} cmd="indent" title="Indent" />
                 <ToolBtn icon={Outdent} cmd="outdent" title="Outdent" />
            </div>

            <div className="ml-auto flex items-center gap-2">
                 <span className="text-[10px] text-gray-500 font-medium bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md border border-black/5 whitespace-nowrap">Last edit {lastSaved}</span>
            </div>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* SIDEBAR (Collapsible) */}
            {targetJob && (
                <div className="w-[300px] bg-white dark:bg-[#1E1E1E] border-r border-black/5 dark:border-white/5 flex flex-col z-30 shrink-0">
                     <div className="p-4 border-b border-black/5 dark:border-white/5 flex gap-2">
                        <button onClick={() => setActiveSidebarTab('strategy')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${activeSidebarTab === 'strategy' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Strategy</button>
                        <button onClick={() => setActiveSidebarTab('keywords')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${activeSidebarTab === 'keywords' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Keywords</button>
                        <button onClick={() => setActiveSidebarTab('snippets')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${activeSidebarTab === 'snippets' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Snippets</button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                         {activeSidebarTab === 'strategy' && (
                            <div className="prose prose-sm text-xs text-gray-600 dark:text-gray-300">
                                {targetJob.analysis?.strategy || "No strategy loaded."}
                            </div>
                         )}
                         {activeSidebarTab === 'keywords' && (
                             <div className="flex flex-wrap gap-2">
                                 {keywords.map(kw => (
                                     <span key={kw} className={`text-xs px-2 py-1 rounded border ${foundKeywords.has(kw) ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 line-through opacity-50' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'}`}>{kw}</span>
                                 ))}
                             </div>
                         )}
                         {activeSidebarTab === 'snippets' && (
                             <div className="space-y-2">
                                 {USER_PROFILE.caseStudies.map(cs => (
                                     <div key={cs.title} onClick={() => insertSnippet(cs.description)} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer text-xs transition-colors">
                                         <strong className="block mb-1 dark:text-white">{cs.title}</strong>
                                         <p className="line-clamp-2 text-gray-500 dark:text-gray-400">{cs.description}</p>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                </div>
            )}

            {/* DOCUMENT CANVAS */}
            <div className="flex-1 overflow-y-auto bg-[#F9FBFD] dark:bg-[#0C0C0C] flex justify-center p-8 custom-scrollbar relative">
                {/* THE PAPER */}
                <div className="origin-top transition-transform duration-200" style={{ transform: `scale(${zoomLevel / 100})` }}>
                    <div 
                        ref={editorRef} 
                        contentEditable 
                        role="textbox" 
                        aria-multiline="true"
                        spellCheck="false"
                        className="bg-white text-black shadow-[0_0_50px_rgba(0,0,0,0.1)] outline-none transition-all duration-300 mb-32"
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
        </div>
    </div>
  );
};

export default CVEditor;