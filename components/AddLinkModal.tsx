
import React, { useState, useEffect } from 'react';
import { X, Link, FileText, Building2, Type, AlertCircle } from 'lucide-react';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { url?: string; text?: string; title?: string; company?: string }) => void;
  existingJobs?: { url?: string; title?: string; company?: string }[];
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, onAdd, existingJobs = [] }) => {
  const [mode, setMode] = useState<'link' | 'text'>('link');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Text Mode State
  const [text, setText] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    if (!isOpen) {
        setError(null);
        setUrl('');
        setText('');
        setManualTitle('');
        setManualCompany('');
        setManualUrl('');
    }
  }, [isOpen]);

  const checkDuplicate = (targetUrl?: string, targetTitle?: string, targetCompany?: string) => {
    if (!targetUrl && (!targetTitle || !targetCompany)) return false;

    return existingJobs.some(job => {
        // Match by exact URL
        if (targetUrl && targetUrl !== 'Manual Entry' && job.url === targetUrl) return true;
        
        // Match by Title + Company (normalized)
        if (targetTitle && targetCompany && job.title && job.company) {
            const matchTitle = job.title.toLowerCase().trim() === targetTitle.toLowerCase().trim();
            const matchCompany = job.company.toLowerCase().trim() === targetCompany.toLowerCase().trim();
            return matchTitle && matchCompany;
        }
        return false;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'link') {
        const trimmedUrl = url.trim();
        if (checkDuplicate(trimmedUrl)) {
            setError("This job link is already in your tracker.");
            return;
        }
        onAdd({ url: trimmedUrl });
        onClose();
    } else {
        if (checkDuplicate(undefined, manualTitle, manualCompany)) {
            setError("A job with this title and company already exists.");
            return;
        }
        onAdd({ 
            text, 
            title: manualTitle || 'Manual Job Entry', 
            company: manualCompany || 'Unknown Company',
            url: manualUrl.trim() || 'Manual Entry' 
        });
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        role="dialog"
        aria-modal="true"
    >
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[32px] shadow-2xl w-full max-w-lg p-0 animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-transparent dark:border-white/10 transition-colors ring-1 ring-black/5">
        
        {/* Header with Tabs */}
        <div className="bg-white dark:bg-[#1C1C1E] px-8 pt-8 pb-4 flex items-center justify-between transition-colors">
            <h2 className="text-[24px] font-bold text-[#1d1d1f] dark:text-white tracking-tight">Add Opportunity</h2>
            <button 
                onClick={onClose} 
                className="w-8 h-8 flex items-center justify-center bg-[#f5f5f7] dark:bg-[#2C2C2E] hover:bg-[#e8e8ed] dark:hover:bg-[#38383A] rounded-full text-[#1d1d1f] dark:text-white transition-colors"
            >
                <X size={18} />
            </button>
        </div>

        <div className="px-8 pb-6">
            <div className="flex bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-full p-1 w-full" role="tablist">
                <button 
                    onClick={() => { setMode('link'); setError(null); }}
                    className={`flex-1 py-2 rounded-full text-[13px] font-bold transition-all ${mode === 'link' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm' : 'text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white'}`}
                >
                    Paste Link
                </button>
                <button 
                    onClick={() => { setMode('text'); setError(null); }}
                    className={`flex-1 py-2 rounded-full text-[13px] font-bold transition-all ${mode === 'text' ? 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-sm' : 'text-[#86868b] dark:text-[#98989D] hover:text-[#1d1d1f] dark:hover:text-white'}`}
                >
                    Manual Entry
                </button>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {mode === 'link' ? (
              <div className="mb-8">
                <label htmlFor="job-url" className="block text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-3">Job URL</label>
                <div className="relative">
                    <Link className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-[#FF3B30]' : 'text-[#86868b] dark:text-[#98989D]'}`} size={20} />
                    <input 
                        id="job-url"
                        type="url" 
                        value={url}
                        onChange={(e) => { setUrl(e.target.value); setError(null); }}
                        placeholder="Paste LinkedIn or Company URL..." 
                        className={`w-full pl-12 pr-4 py-4 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-2xl font-medium text-[#1d1d1f] dark:text-white outline-none transition-all placeholder:text-[#86868b] dark:placeholder:text-[#636366] text-lg ${error ? 'ring-2 ring-[#FF3B30] bg-[#FF3B30]/5' : 'focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF]'}`}
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
                            onChange={(e) => { setManualTitle(e.target.value); setError(null); }}
                            className={`w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl text-[14px] font-medium text-[#1d1d1f] dark:text-white outline-none transition-all ${error ? 'ring-2 ring-[#FF3B30] bg-[#FF3B30]/5' : 'focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF]'}`}
                            required={mode === 'text'}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-2">Company</label>
                        <input 
                            type="text" 
                            value={manualCompany}
                            onChange={(e) => { setManualCompany(e.target.value); setError(null); }}
                            className={`w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl text-[14px] font-medium text-[#1d1d1f] dark:text-white outline-none transition-all ${error ? 'ring-2 ring-[#FF3B30] bg-[#FF3B30]/5' : 'focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF]'}`}
                            required={mode === 'text'}
                        />
                      </div>
                  </div>

                  <div>
                     <label className="block text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-2">Link (Apply URL)</label>
                     <input 
                        type="url" 
                        value={manualUrl}
                        onChange={(e) => { setManualUrl(e.target.value); setError(null); }}
                        placeholder="https://..."
                        className="w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl text-[14px] font-medium text-[#1d1d1f] dark:text-white outline-none focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider mb-2">Description</label>
                    <textarea 
                        value={text}
                        onChange={(e) => { setText(e.target.value); setError(null); }}
                        placeholder="Paste job description..." 
                        className="w-full p-4 h-32 bg-[#f5f5f7] dark:bg-[#2C2C2E] rounded-xl font-medium text-[14px] text-[#1d1d1f] dark:text-white outline-none focus:ring-2 focus:ring-[#0071e3] dark:focus:ring-[#0A84FF] resize-none"
                        required
                    />
                  </div>
              </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="text-[#FF3B30] shrink-0" size={18} />
                <p className="text-[13px] font-medium text-[#FF3B30]">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[#f5f5f7] dark:border-[#38383A]">
            <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 text-[14px] font-bold text-[#86868b] dark:text-[#98989D] hover:bg-[#f5f5f7] dark:hover:bg-[#2C2C2E] rounded-full transition-colors"
            >
                Cancel
            </button>
            <button 
                type="submit"
                className="px-8 py-3 text-[14px] font-bold text-white bg-[#0071e3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#409CFF] rounded-full transition-colors shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 hover:scale-105 active:scale-95 transform"
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
