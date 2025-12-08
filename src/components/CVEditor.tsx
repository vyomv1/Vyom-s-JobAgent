import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, RotateCcw, RotateCw, Wand2, Search, Type, List, X, Check, Save } from 'lucide-react';
import { improveCV } from '../services/geminiService';

const CVEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [lastSaved, setLastSaved] = useState<string>('');
  
  // AI Panel State
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiMode, setAiMode] = useState<'impact' | 'clarify' | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    const saved = localStorage.getItem('cv_content');
    if (saved && editorRef.current) {
        editorRef.current.innerHTML = saved;
        setLastSaved('Restored from backup');
    } else if (editorRef.current && !editorRef.current.innerHTML.trim()) {
        // Default Content
        editorRef.current.innerHTML = `
        <h1 style="font-size: 2em; font-weight: bold; margin-bottom: 0.5em; color: var(--md-sys-color-primary);">Senior UX Designer</h1>
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

  const saveContent = useCallback(() => {
    if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        localStorage.setItem('cv_content', html);
        const now = new Date();
        setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  // Debounced auto-save
  useEffect(() => {
      const handleInput = () => saveContent();
      const el = editorRef.current;
      el?.addEventListener('input', handleInput);
      return () => el?.removeEventListener('input', handleInput);
  }, [saveContent]);

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    saveContent();
  };

  const initAI = (type: 'impact' | 'clarify') => {
    const selection = window.getSelection();
    const text = selection?.toString();
    
    if (!text || text.trim().length === 0) {
        alert("Please highlight text in your CV first.");
        return;
    }
    
    setSelectedText(text);
    setAiMode(type);
    setShowAiPanel(true);
    setAiSuggestion('');
    generateSuggestion(text, type);
  };

  const generateSuggestion = async (text: string, type: 'impact' | 'clarify') => {
    setIsAiLoading(true);
    try {
        const promptText = type === 'impact' 
            ? "Identify weak verbs and passive voice. Rewrite this to be action-oriented, using strong power verbs. Return ONLY the rewritten text." 
            : "Clarify this text. Remove fluff, fix grammar, and make it concise and punchy. Return ONLY the rewritten text.";
        
        const result = await improveCV(text, promptText);
        setAiSuggestion(result);
    } catch (e) {
        setAiSuggestion("Error generating suggestion. Please try again.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const applySuggestion = () => {
      if (editorRef.current && aiSuggestion) {
          editorRef.current.focus();
          document.execCommand('insertText', false, aiSuggestion);
          saveContent();
          closeAiPanel();
      }
  };

  const closeAiPanel = () => {
      setShowAiPanel(false);
      setAiMode(null);
      setSelectedText('');
      setAiSuggestion('');
  };

  return (
    <div className="flex h-[calc(100vh-100px)] relative bg-[#F8F9FA] rounded-[32px] overflow-hidden border border-[#DADCE0] shadow-sm">
        
        {/* Main Editor Area */}
        <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${showAiPanel ? 'mr-[320px]' : ''}`}>
            
            {/* Toolbar */}
            <div className="flex-none bg-[#F1F3F4] px-6 py-4 flex items-center gap-4 border-b border-[#DADCE0] z-10 sticky top-0 overflow-x-auto scrollbar-hide shadow-sm">
                
                <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-[#DADCE0]">
                    <button onClick={() => execCmd('undo')} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368] transition-colors"><RotateCcw size={16} /></button>
                    <button onClick={() => execCmd('redo')} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368] transition-colors"><RotateCw size={16} /></button>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-[#DADCE0]">
                    <button onClick={() => execCmd('formatBlock', 'H2')} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368] font-bold" title="Heading"><Type size={16} /></button>
                    <button onClick={() => execCmd('bold')} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368] font-bold"><Bold size={16} /></button>
                    <button onClick={() => execCmd('italic')} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368] italic"><Italic size={16} /></button>
                    <button onClick={() => execCmd('underline')} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368] underline"><Underline size={16} /></button>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-[#DADCE0]">
                    <button onClick={() => execCmd('justifyLeft')} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368]"><AlignLeft size={16} /></button>
                    <button onClick={() => execCmd('justifyCenter')} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368]"><AlignCenter size={16} /></button>
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368]"><List size={16} /></button>
                </div>

                <div className="w-px h-6 bg-[#DADCE0]"></div>

                {/* AI Actions */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => initAI('impact')} 
                        className="flex items-center gap-2 px-4 py-2 bg-[#E8F0FE] text-[#1967D2] rounded-full text-sm font-bold hover:shadow-md transition-all hover:bg-[#D2E3FC]"
                    >
                        <Search size={16} /> Impact Check
                    </button>
                    <button 
                        onClick={() => initAI('clarify')} 
                        className="flex items-center gap-2 px-4 py-2 bg-[#F1F3F4] text-[#202124] rounded-full text-sm font-bold hover:shadow-md transition-all hover:bg-[#DADCE0]"
                    >
                        <Wand2 size={16} /> Clarify
                    </button>
                </div>
                
                 <div className="ml-auto flex items-center gap-2 text-xs font-medium text-[#5F6368] bg-white px-3 py-1.5 rounded-full border border-[#DADCE0]">
                    <Save size={12} className={lastSaved ? 'text-green-600' : 'text-gray-400'} />
                    {lastSaved ? `Saved ${lastSaved}` : 'Unsaved'}
                </div>
            </div>

            {/* Paper */}
            <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-8 flex justify-center bg-[#F8F9FA]">
                <div 
                    ref={editorRef}
                    contentEditable
                    className="w-full max-w-[850px] min-h-[1100px] bg-white shadow-sm hover:shadow-md border border-[#DADCE0] p-[72px] outline-none text-[#202124] font-sans text-lg leading-[1.6] transition-all rounded-sm"
                    style={{ marginBottom: '4rem' }}
                />
            </div>
        </div>

        {/* Right Sidebar for AI Results */}
        <div className={`absolute top-0 right-0 h-full w-[320px] bg-white border-l border-[#DADCE0] shadow-xl transform transition-transform duration-300 z-20 flex flex-col ${showAiPanel ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-5 border-b border-[#DADCE0] flex items-center justify-between bg-[#F8F9FA]">
                <h3 className="font-bold text-[#202124] flex items-center gap-2">
                    {aiMode === 'impact' ? <Search size={18} className="text-[#1a73e8]" /> : <Wand2 size={18} className="text-[#1a73e8]" />}
                    {aiMode === 'impact' ? 'Impact Review' : 'Clarify Text'}
                </h3>
                <button onClick={closeAiPanel} className="p-1 hover:bg-[#F1F3F4] rounded-full text-[#5F6368]">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div className="mb-6">
                    <label className="text-xs font-bold text-[#70757A] uppercase tracking-wider mb-2 block">Original</label>
                    <div className="p-3 bg-[#F8F9FA] rounded-xl text-sm text-[#5F6368] border border-[#E8F0FE] italic">
                        "{selectedText}"
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-[#70757A] uppercase tracking-wider mb-2 block">Suggestion</label>
                    {isAiLoading ? (
                        <div className="flex flex-col items-center py-8 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a73e8]"></div>
                            <span className="text-xs text-[#5F6368] animate-pulse">Polishing your words...</span>
                        </div>
                    ) : (
                        <div className="p-4 bg-white rounded-xl text-sm text-[#202124] border-2 border-[#1a73e8] shadow-sm">
                            {aiSuggestion}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-5 border-t border-[#DADCE0] bg-[#F8F9FA]">
                <button 
                    onClick={applySuggestion}
                    disabled={isAiLoading || !aiSuggestion}
                    className="w-full py-3 bg-[#1a73e8] text-white rounded-xl font-bold hover:bg-[#1557B0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                    <Check size={18} /> Apply Change
                </button>
            </div>
        </div>
    </div>
  );
};

export default CVEditor;