
import React, { useState } from 'react';
import { X, Link } from 'lucide-react';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string) => void;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [url, setUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAdd(url);
      setUrl('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200 border border-[#DADCE0]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#202124]">Add Job from Link</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#F1F3F4] rounded-full text-[#5F6368] transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
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
            <p className="text-xs text-[#70757A] mt-2 ml-1">Paste a URL from LinkedIn, Indeed, or a company career page.</p>
          </div>
          
          <div className="flex justify-end gap-3">
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
                <Link size={16} /> Add Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLinkModal;
