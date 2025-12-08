
import React from 'react';
import { X, Copy, Download, Loader2, Briefcase } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-t-4 border-[#86BC25]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-white rounded-sm">
                <Briefcase size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black uppercase tracking-tight">Application Strategy Kit</h2>
              {job && <p className="text-sm text-gray-500 font-medium">Target: <span className="text-[#86BC25] font-bold">{job.title}</span> at {job.company}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
              <Loader2 size={40} className="animate-spin text-[#86BC25]" />
              <div>
                  <p className="text-lg font-bold text-black text-center">Formulating Strategy...</p>
                  <p className="text-sm opacity-75 text-center mt-1">Analyzing fit, prepping interview questions, and drafting letter.</p>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm prose-gray max-w-none bg-white p-8 border border-gray-200 shadow-sm">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">{content}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
           <button 
             onClick={onClose}
             className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-100 rounded-sm transition-colors"
           >
             Close
           </button>
           <button 
             onClick={handleCopy}
             disabled={isGenerating}
             className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-[#86BC25] hover:text-black rounded-sm shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <Copy size={16} />
             Copy Kit to Clipboard
           </button>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterModal;
