
import React, { useState } from 'react';
import { X, Link, FileText, Building2, Type } from 'lucide-react';

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
  const [manualUrl, setManualUrl] = useState('');

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
          url: manualUrl.trim() || 'Manual Entry' 
      });
      setText('');
      setManualTitle('');
      setManualCompany('');
      setManualUrl('');
      onClose();
    }
  };

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
    >
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[32px] shadow-2xl w-full max-w-lg p-0 animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-transparent dark:border-white/10 transition-colors">
        
        {/* Header with Tabs */}
        <div className="bg-white dark:bg-[#1C1C1E] px-8 pt-8 pb-4 flex items-center justify-between transition-colors">
            <h2 className="text-[24px] font-semibold text-[#1d1d1f] dark:text-white">Add Job</h2>
            <button 
                onClick={onClose} 
                className="w-8 h-8 flex items-center justify-center bg-[#f5f5f7] dark:bg-[#2C2C2E] hover:bg-[#e8e8ed] dark:hover:bg-[#38383A] rounded-full text-[#1d1d1f] dark:text-white transition-colors"
            >
                <X size={18} />
            </button>
        </div>

        <div className="px-8 pb-6">
            <div className="flex bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-full p-1 w-fit" role="tablist">
                <button 
                    onClick={() => setMode('link')}
                    className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${mode === 'link' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm' : 'text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white'}`}
                >
                    Link
                </button>
                <button 
                    onClick={() => setMode('text')}
                    className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${mode === 'text' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm' : 'text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white'}`}
                >
                    Text
                </button>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {mode === 'link' ? (
              <div className="mb-8">
                <label htmlFor="job-url" className="block text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-2">Job URL</label>
                <div className="relative">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] dark:text-[#98989D]" size={18} />
                    <input 
                        id="job-url"
                        type="url" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste link here..." 
                        className="w-full pl-12 pr-4 py-4 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-2xl font-medium text-[#1d1d1f] dark:text-white focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF] outline-none transition-all placeholder:text-[#86868b] dark:placeholder:text-[#636366]"
                        autoFocus
                        required
                    />
                </div>
              </div>
          ) : (
              <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-2">Title</label>
                        <input 
                            type="text" 
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl text-[14px] font-medium text-[#1d1d1f] dark:text-white outline-none focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-2">Company</label>
                        <input 
                            type="text" 
                            value={manualCompany}
                            onChange={(e) => setManualCompany(e.target.value)}
                            className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl text-[14px] font-medium text-[#1d1d1f] dark:text-white outline-none focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF]"
                        />
                      </div>
                  </div>

                  <div>
                     <label className="block text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-2">Link (Apply URL)</label>
                     <input 
                        type="url" 
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl text-[14px] font-medium text-[#1d1d1f] dark:text-white outline-none focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-2">Description</label>
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste job description..." 
                        className="w-full p-4 h-32 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl font-medium text-[14px] text-[#1d1d1f] dark:text-white outline-none focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF] resize-none"
                        required
                    />
                  </div>
              </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[#f5f5f7] dark:border-[#38383A]">
            <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 text-[14px] font-semibold text-[#86868b] dark:text-[#98989D] hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] rounded-full transition-colors"
            >
                Cancel
            </button>
            <button 
                type="submit"
                className="px-8 py-3 text-[14px] font-semibold text-white bg-[#0071e3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#409CFF] rounded-full transition-colors shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20"
            >
                {mode === 'link' ? 'Scout' : 'Analyze'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLinkModal;
