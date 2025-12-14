
import React, { useState } from 'react';
import { X, Link, FileText, AlignLeft, Building2, Type } from 'lucide-react';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { url?: string; text?: string; title?: string; company?: string }) => void;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [mode, setMode] = useState<'link' | 'text'>('link');
  const [url, setUrl] = useState('');
  
  // Text Mode State
  const [text, setText] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'link' && url.trim()) {
      onAdd({ url });
      setUrl('');
      onClose();
    } else if (mode === 'text' && text.trim()) {
      onAdd({ 
          text, 
          title: manualTitle || 'Manual Job Entry', 
          company: manualCompany || 'Unknown Company',
          url: 'Manual Entry' 
      });
      setText('');
      setManualTitle('');
      setManualCompany('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] shadow-xl w-full max-w-lg p-0 animate-in fade-in zoom-in-95 duration-200 border border-[#DADCE0] overflow-hidden">
        
        {/* Header with Tabs */}
        <div className="bg-[#F8F9FA] border-b border-[#DADCE0] px-6 py-4 flex items-center justify-between">
            <div className="flex bg-white rounded-full p-1 border border-[#DADCE0] shadow-sm">
                <button 
                    onClick={() => setMode('link')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${mode === 'link' ? 'bg-[#1a73e8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'}`}
                >
                    <Link size={14} /> Link
                </button>
                <button 
                    onClick={() => setMode('text')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${mode === 'text' ? 'bg-[#1a73e8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'}`}
                >
                    <FileText size={14} /> Paste Text
                </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#E8EAED] rounded-full text-[#5F6368] transition-colors">
                <X size={20} />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {mode === 'link' ? (
              <div className="mb-6">
                <label className="block text-xs font-bold text-[#5F6368] uppercase tracking-wider mb-2">Job URL</label>
                <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={18} />
                    <input 
                        type="url" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://linkedin.com/jobs/..." 
                        className="w-full pl-10 pr-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none text-[#202124] transition-all"
                        autoFocus
                        required
                    />
                </div>
                <p className="text-xs text-[#70757A] mt-2 ml-1">Best for public links (Indeed, Company Sites).</p>
              </div>
          ) : (
              <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#5F6368] uppercase tracking-wider mb-2">Job Title</label>
                        <div className="relative">
                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={16} />
                            <input 
                                type="text" 
                                value={manualTitle}
                                onChange={(e) => setManualTitle(e.target.value)}
                                placeholder="e.g. Senior Designer" 
                                className="w-full pl-9 pr-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1a73e8] outline-none text-sm font-medium"
                            />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5F6368] uppercase tracking-wider mb-2">Company</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]" size={16} />
                            <input 
                                type="text" 
                                value={manualCompany}
                                onChange={(e) => setManualCompany(e.target.value)}
                                placeholder="e.g. Google" 
                                className="w-full pl-9 pr-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1a73e8] outline-none text-sm font-medium"
                            />
                        </div>
                      </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5F6368] uppercase tracking-wider mb-2">Job Description</label>
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste the full job description here..." 
                        className="w-full p-4 h-48 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none text-[#202124] transition-all resize-none text-sm leading-relaxed"
                        autoFocus
                        required
                    />
                  </div>
              </div>
          )}
          
          <div className="flex justify-end gap-3 pt-2 border-t border-[#F1F3F4]">
            <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition-colors"
            >
                Cancel
            </button>
            <button 
                type="submit"
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#1a73e8] hover:bg-[#1557B0] rounded-full transition-colors shadow-sm flex items-center gap-2"
            >
                {mode === 'link' ? <Link size={16} /> : <FileText size={16} />}
                {mode === 'link' ? 'Scout URL' : 'Analyze Text'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLinkModal;
