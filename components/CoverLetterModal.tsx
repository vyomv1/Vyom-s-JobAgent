
import React from 'react';
import { X, Copy, Download, Loader2, Briefcase, FileText } from 'lucide-react';
import { Job } from '../types';

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  content: string;
  isGenerating: boolean;
}

const CoverLetterModal: React.FC<CoverLetterModalProps> = ({ isOpen, onClose, job, content, isGenerating }) => {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div 
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
    >
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-transparent dark:border-white/10 ring-1 ring-black/5">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0071e3] text-white rounded-full flex items-center justify-center shadow-md">
                <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">Application Strategy Kit</h2>
              {job && <p className="text-xs font-medium text-[#86868b] dark:text-[#98989D] mt-0.5">Target: <span className="text-[#0071e3] dark:text-[#0A84FF]">{job.title}</span> at {job.company}</p>}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full text-[#1d1d1f] dark:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#f5f5f7] dark:bg-black custom-scrollbar">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <Loader2 size={48} className="animate-spin text-[#0071e3]" />
              <div className="text-center">
                  <p className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-2">Formulating Strategy...</p>
                  <p className="text-sm text-[#86868b] dark:text-[#98989D]">Analyzing fit, prepping interview questions, and drafting letter.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto bg-white text-[#1d1d1f] p-12 shadow-xl rounded-sm min-h-full">
              <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-[#1d1d1f]">{content}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#1C1C1E] flex justify-end gap-4">
           <button 
             onClick={onClose}
             className="px-6 py-3 text-sm font-bold text-[#86868b] dark:text-[#98989D] hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
           >
             Close
           </button>
           <button 
             onClick={handleCopy}
             disabled={isGenerating}
             className="px-8 py-3 text-sm font-bold text-white bg-[#1d1d1f] dark:bg-white dark:text-black hover:bg-black dark:hover:bg-[#E5E5EA] rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <Copy size={16} />
             Copy to Clipboard
           </button>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterModal;
