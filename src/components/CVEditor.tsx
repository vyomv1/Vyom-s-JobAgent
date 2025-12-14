
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw, List, Save, BookOpen } from 'lucide-react';
import { saveCV, getCV } from '../services/firebase';

const CVEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [lastSaved, setLastSaved] = useState<string>('');
  
  // Reference Doc State
  const [showDoc, setShowDoc] = useState(false);

  // Initial Load from Firestore
  useEffect(() => {
    const loadContent = async () => {
        const content = await getCV();
        if (content && editorRef.current) {
            editorRef.current.innerHTML = content;
            setLastSaved('Loaded from Cloud');
        } else if (editorRef.current && !editorRef.current.innerHTML.trim()) {
            // Default Content if nothing in DB
            editorRef.current.innerHTML = `
            <h1 style="font-size: 2em; font-weight: bold; margin-bottom: 0.5em; color: #1d1d1f;">Senior UX Designer</h1>
            <p><strong>Summary</strong></p>
            <p>Strategic and human-centered Senior UX Designer with 7+ years of experience transforming complex financial and insurance problems into intuitive digital solutions.</p>
            <br>
            <p><strong>Experience</strong></p>
            <p><strong>Lead Product Designer | Intact Insurance</strong></p>
            <ul>
                <li>Spearheaded the redesign of the claims portal, reducing processing time by 30%.</li>
                <li>Mentored junior designers and established the 'Trove' design system.</li>
            </ul>
            `;
        }
    };
    loadContent();
  }, []);

  const saveContent = useCallback(async () => {
    if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        // Save to Firestore
        await saveCV(html);
        const now = new Date();
        setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  // Debounced auto-save
  useEffect(() => {
      const handleInput = () => {
          const timeoutId = setTimeout(() => {
              saveContent();
          }, 1000);
          return () => clearTimeout(timeoutId);
      };
      
      const el = editorRef.current;
      const rawInputHandler = () => {
         handleInput();
      };
      
      el?.addEventListener('input', rawInputHandler);
      return () => el?.removeEventListener('input', rawInputHandler);
  }, [saveContent]);

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    saveContent();
  };

  return (
    <div className={`flex h-[calc(100vh-140px)] gap-6 mx-auto relative px-6 pb-6 transition-all duration-500 ease-out ${showDoc ? 'w-full max-w-none' : 'max-w-[1400px]'}`}>
        
        {/* Editor Container - Apple Card Style */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-sm overflow-hidden border border-black/5 dark:border-white/10 transition-all duration-300">
            
            {/* Toolbar */}
            <div className="h-14 border-b border-[#f5f5f7] dark:border-[#38383A] flex items-center px-4 justify-between bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md z-10 sticky top-0 transition-colors">
                <div className="flex items-center gap-1" role="toolbar" aria-label="Formatting Controls">
                    <button onClick={() => execCmd('undo')} className="p-2 hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] rounded-md text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white transition-colors" title="Undo"><RotateCcw size={16} /></button>
                    <button onClick={() => execCmd('redo')} className="p-2 hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] rounded-md text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white transition-colors" title="Redo"><RotateCw size={16} /></button>
                    
                    <div className="w-px h-5 bg-[#e8e8ed] dark:bg-[#38383A] mx-2"></div>

                    <button onClick={() => execCmd('bold')} className="p-2 hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] rounded-md text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white font-bold" title="Bold"><Bold size={16} /></button>
                    <button onClick={() => execCmd('italic')} className="p-2 hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] rounded-md text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white italic" title="Italic"><Italic size={16} /></button>
                    <button onClick={() => execCmd('underline')} className="p-2 hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] rounded-md text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white underline" title="Underline"><Underline size={16} /></button>
                    
                    <div className="w-px h-5 bg-[#e8e8ed] dark:bg-[#38383A] mx-2"></div>

                    <button onClick={() => execCmd('justifyLeft')} className="p-2 hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] rounded-md text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white" title="Align Left"><AlignLeft size={16} /></button>
                    <button onClick={() => execCmd('justifyCenter')} className="p-2 hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] rounded-md text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white" title="Align Center"><AlignCenter size={16} /></button>
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] rounded-md text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white" title="List"><List size={16} /></button>
                </div>

                <div className="flex items-center gap-3">
                     {/* Reference Toggle */}
                    <button
                        onClick={() => setShowDoc(!showDoc)}
                        className={`h-8 px-4 rounded-full transition-all border flex items-center gap-2 text-xs font-semibold ${showDoc ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-black border-transparent shadow-md' : 'bg-white dark:bg-[#2C2C2E] text-[#86868b] dark:text-[#98989D] border-[#e8e8ed] dark:border-[#38383A] hover:border-[#86868b] dark:hover:border-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white'}`}
                        title="Reference Document"
                    >
                        <BookOpen size={14} /> {showDoc ? 'Hide Ref' : 'Show Ref'}
                    </button>
                    
                     <div className="text-[10px] font-medium text-[#86868b] dark:text-[#98989D] bg-[#f5f5f7] dark:bg-[#2C2C2E] px-3 py-1.5 rounded-full border border-black/5 dark:border-white/5">
                        {lastSaved ? `Saved ${lastSaved}` : 'Unsaved'}
                    </div>
                </div>
            </div>

            {/* Editor Canvas Container */}
            <div className="flex-1 overflow-y-auto bg-[#F5F5F7] dark:bg-[#000000] flex relative custom-scrollbar transition-colors">
                
                {/* Reference Doc (Left) */}
                {showDoc && (
                    <div className="w-1/2 h-full border-r border-[#e8e8ed] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] hidden lg:block animate-in slide-in-from-left-4 duration-500 ease-out">
                        <iframe 
                            src="https://docs.google.com/document/d/1RcERxf9--nMGdxXTHAt4q35yynk39Aqk31AqSuG02G4/preview" 
                            className="w-full h-full border-none" 
                            title="Reference CV"
                        ></iframe>
                    </div>
                )}

                {/* Paper - Always White for Realism */}
                <div className={`flex-1 flex justify-center p-8 transition-all duration-500 ${showDoc ? 'bg-[#f0f0f2] dark:bg-[#121212]' : ''}`}>
                     <div 
                        ref={editorRef}
                        contentEditable
                        role="textbox"
                        aria-multiline="true"
                        className={`w-full h-max bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.5)] border border-[#e8e8ed] p-[72px] outline-none text-[#1d1d1f] font-sans text-lg leading-[1.6] transition-all rounded-sm mb-16 ${showDoc ? 'max-w-full' : 'max-w-[850px]'}`}
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

export default CVEditor;
