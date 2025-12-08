
import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw, Wand2, Search, Type, List } from 'lucide-react';
import { improveCV } from '../services/geminiService';

const CVEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');

  // Initial Load
  useEffect(() => {
    const saved = localStorage.getItem('cv_content');
    if (saved && editorRef.current) {
        editorRef.current.innerHTML = saved;
        setLastSaved(new Date().toLocaleTimeString());
    } else if (editorRef.current && !editorRef.current.innerHTML.trim()) {
        // Default Content
        editorRef.current.innerHTML = `
        <h1 style="font-size: 2em; font-weight: bold; margin-bottom: 0.5em;">Senior UX Designer</h1>
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
  }, []);

  const saveContent = () => {
    if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        localStorage.setItem('cv_content', html);
        setLastSaved(new Date().toLocaleTimeString());
    }
  };

  const handleInput = () => {
      saveContent();
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    saveContent();
  };

  const handleAIImprove = async (type: 'impact' | 'clarify') => {
    setIsImproving(true);
    const selection = window.getSelection();
    const text = selection?.toString();
    
    if (!text) {
        alert("Please highlight text to improve.");
        setIsImproving(false);
        return;
    }

    try {
        const promptText = type === 'impact' 
            ? "Identify weak verbs and replace them with power verbs. Keep it concise." 
            : "Clarify this text. Remove fluff, fix grammar, make it punchy.";
        
        const improved = await improveCV(text, promptText);
        document.execCommand('insertText', false, improved);
        saveContent();
    } catch (e) {
        alert("AI Error");
    } finally {
        setIsImproving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] relative overflow-hidden bg-[#F0F4F9] rounded-[24px]">
        
        {/* Fixed Toolbar */}
        <div className="flex-none bg-[#F9FAFA] px-6 py-4 flex items-center gap-4 border-b border-gray-200 z-10 sticky top-0 overflow-x-auto scrollbar-hide shadow-sm">
            
            <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                <button onClick={() => execCmd('undo')} className="p-2 hover:bg-gray-100 rounded-full text-slate-600 transition-colors"><RotateCcw size={16} /></button>
                <button onClick={() => execCmd('redo')} className="p-2 hover:bg-gray-100 rounded-full text-slate-600 transition-colors"><RotateCw size={16} /></button>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                <button onClick={() => execCmd('formatBlock', 'H2')} className="p-2 hover:bg-gray-100 rounded-full text-slate-600 font-bold" title="Heading"><Type size={16} /></button>
                <button onClick={() => execCmd('bold')} className="p-2 hover:bg-gray-100 rounded-full text-slate-600 font-bold"><Bold size={16} /></button>
                <button onClick={() => execCmd('italic')} className="p-2 hover:bg-gray-100 rounded-full text-slate-600 italic"><Italic size={16} /></button>
                <button onClick={() => execCmd('underline')} className="p-2 hover:bg-gray-100 rounded-full text-slate-600 underline"><Underline size={16} /></button>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                <button onClick={() => execCmd('justifyLeft')} className="p-2 hover:bg-gray-100 rounded-full text-slate-600"><AlignLeft size={16} /></button>
                <button onClick={() => execCmd('justifyCenter')} className="p-2 hover:bg-gray-100 rounded-full text-slate-600"><AlignCenter size={16} /></button>
                <button onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-gray-100 rounded-full text-slate-600"><List size={16} /></button>
            </div>

            <div className="w-px h-6 bg-gray-300"></div>

            {/* AI Actions */}
            <div className="flex gap-2">
                <button 
                    onClick={() => handleAIImprove('impact')} 
                    disabled={isImproving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C2E7FF] text-[#001D35] rounded-full text-sm font-medium hover:shadow-md transition-all disabled:opacity-50"
                >
                    <Search size={16} /> Impact
                </button>
                <button 
                    onClick={() => handleAIImprove('clarify')} 
                    disabled={isImproving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E8DEF8] text-[#1D192B] rounded-full text-sm font-medium hover:shadow-md transition-all disabled:opacity-50"
                >
                    <Wand2 size={16} /> Clarify
                </button>
            </div>
            
             <div className="ml-auto text-xs text-gray-400 font-medium">
                {lastSaved ? `Saved ${lastSaved}` : 'Unsaved'}
            </div>
        </div>

        {/* Scrollable Paper Container */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-8 flex justify-center bg-[#F0F4F9]">
            <div 
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="w-full max-w-[850px] min-h-[1100px] bg-white shadow-md p-[72px] outline-none text-[#1F1F1F] font-sans text-lg leading-[1.6] transition-all"
                style={{ marginBottom: '4rem' }}
            />
        </div>
    </div>
  );
};

export default CVEditor;
