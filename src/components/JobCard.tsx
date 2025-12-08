
import React from 'react';
import { Job } from '../types';
import { CheckCircle2, AlertTriangle, Briefcase, MapPin, ExternalLink, FileText, TrendingUp, Trash2, Clock, Zap, Bookmark, Archive, ArrowRight, ArrowLeft } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onOpenDetail: (job: Job, tab?: 'brief' | 'strategy') => void;
  onToggleStatus: (id: string, currentStatus: Job['status']) => void;
  onDelete: (id: string) => void;
  isKanban?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onOpenDetail, onToggleStatus, onDelete, isKanban }) => {
  const analysis = job.analysis;
  const status = job.status || 'new';
  const isSavedOrBetter = ['saved', 'applied', 'interview', 'offer'].includes(status);
  const applyUrl = job.url || `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}`;

  if (isKanban) {
      return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#EFEBE9] hover:shadow-md transition-all group flex flex-col gap-3 relative cursor-grab active:cursor-grabbing">
            <div className="flex justify-between items-start">
                <h4 onClick={() => onOpenDetail(job)} className="font-bold text-sm text-[#2D1810] leading-snug line-clamp-2 cursor-pointer hover:text-[#D97736] transition-colors">{job.title}</h4>
                <div className={`w-2 h-2 rounded-full ${analysis?.isHighValue ? 'bg-[#D97736]' : 'bg-[#D7CCC8]'}`}></div>
            </div>
            <p className="text-xs font-medium text-[#5D4037]">{job.company}</p>
            
            <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[#EFEBE9]">
                {/* Back Button */}
                {status !== 'saved' && (
                     <button onClick={() => {
                         if (status === 'applied') onToggleStatus(job.id, 'saved');
                         if (status === 'interview') onToggleStatus(job.id, 'applied');
                         if (status === 'offer') onToggleStatus(job.id, 'interview');
                     }} className="p-2 text-[#A1887F] hover:bg-[#FDF2EC] rounded-full transition-colors" title="Move Back">
                        <ArrowLeft size={14} />
                    </button>
                )}
                
                <button onClick={() => onOpenDetail(job)} className="p-2 text-[#A1887F] hover:bg-[#FFDBC8] hover:text-[#2D1810] rounded-full transition-colors mx-auto">
                    <FileText size={16} />
                </button>

                {/* Forward Button */}
                 {status !== 'offer' && (
                     <button onClick={() => {
                         if (status === 'saved') onToggleStatus(job.id, 'applied');
                         if (status === 'applied') onToggleStatus(job.id, 'interview');
                         if (status === 'interview') onToggleStatus(job.id, 'offer');
                     }} className="p-2 text-white bg-[#2D1810] hover:bg-[#D97736] rounded-full transition-colors shadow-sm" title="Move Forward">
                        <ArrowRight size={14} />
                    </button>
                )}
            </div>
        </div>
      );
  }

  return (
    <div className={`bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-[#EFEBE9] relative group overflow-hidden ${status === 'archived' ? 'opacity-50 grayscale' : ''}`}>
      
      {/* Top Right Actions */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
         <button onClick={() => onDelete(job.id)} className="p-2.5 text-[#D7CCC8] hover:text-red-500 hover:bg-red-50 rounded-full transition-all" title={status === 'archived' ? "Delete Permanently" : "Archive"}>
            {status === 'archived' ? <Trash2 size={18} /> : <Archive size={18} />}
         </button>
         
         {status !== 'archived' && (
             <button 
                onClick={() => onToggleStatus(job.id, status)}
                className={`p-2.5 rounded-full transition-all border ${isSavedOrBetter 
                    ? 'bg-[#2D1810] text-white border-[#2D1810] shadow-md' 
                    : 'bg-white text-[#A1887F] border-[#EFEBE9] hover:border-[#D7CCC8]'}`}
             >
                 <Bookmark size={18} fill={isSavedOrBetter ? "currentColor" : "none"} />
             </button>
         )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
          {/* Score Circle */}
          <div className="shrink-0">
             {analysis ? (
                 <div className="w-20 h-20 rounded-full bg-[#FFDBC8] text-[#D97736] flex flex-col items-center justify-center border-4 border-white shadow-sm ring-1 ring-[#FBEFE9]">
                    <span className="text-2xl font-black tracking-tight">{analysis.score}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Score</span>
                 </div>
             ) : (
                 <div className="w-20 h-20 rounded-full bg-[#F5EBE9] border-4 border-white shadow-sm flex items-center justify-center animate-pulse">
                     <span className="text-[10px] font-bold text-[#A1887F]">SCAN</span>
                 </div>
             )}
          </div>

          <div className="flex-1 pr-12">
             <div className="cursor-pointer group/title" onClick={() => onOpenDetail(job)}>
                <h3 className="text-2xl font-bold text-[#2D1810] group-hover/title:text-[#D97736] transition-colors leading-tight mb-2 flex items-start gap-2">
                    {job.title}
                    {job.isRelatedDiscovery && <Zap size={18} className="text-amber-500 fill-amber-500 mt-1" />}
                </h3>
                <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-[#5D4037]">
                    <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-[#A1887F]" /> {job.company}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-[#A1887F]" /> {job.location}</span>
                    {job.postedDate && <span className="flex items-center gap-1.5"><Clock size={16} className="text-[#A1887F]" /> {job.postedDate}</span>}
                </div>
             </div>

             {/* Tags */}
             <div className="flex flex-wrap items-center gap-2 mt-4 mb-6">
                {job.seniorityScore && (
                     <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EFEBE9] text-[#3E2723] border border-[#D7CCC8]">{job.seniorityScore}</span>
                )}
                {analysis && !isSavedOrBetter && analysis.isHighValue && (
                     <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] flex items-center gap-1"><TrendingUp size={14} /> High Value</span>
                )}
                {analysis && !isSavedOrBetter && analysis.isCommuteRisk && (
                     <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] flex items-center gap-1"><AlertTriangle size={14} /> Commute Risk</span>
                )}
             </div>

             {/* Verdict */}
             {analysis ? (
                 <div className="p-4 bg-[#FDF2EC] rounded-2xl border border-[#FFDBC8] flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-[#D97736] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#3E2723] leading-relaxed font-medium">{analysis.verdict}</p>
                 </div>
             ) : (
                 <div className="space-y-2 max-w-md">
                     <div className="h-2 bg-[#F5EBE9] rounded-full w-full animate-pulse"></div>
                     <div className="h-2 bg-[#F5EBE9] rounded-full w-2/3 animate-pulse"></div>
                 </div>
             )}

             {/* Actions */}
             <div className="flex items-center gap-4 mt-8">
                 <button onClick={() => onOpenDetail(job, 'strategy')} disabled={!analysis} className="px-6 py-2.5 rounded-full text-sm font-bold bg-white border border-[#EFEBE9] text-[#5D4037] hover:border-[#D97736] hover:text-[#D97736] transition-all flex items-center gap-2">
                     <FileText size={18} /> Strategy Kit
                 </button>
                 <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#2D1810] text-white hover:bg-[#D97736] hover:shadow-lg transition-all flex items-center gap-2">
                     Apply Now <ExternalLink size={18} />
                 </a>
             </div>
          </div>
      </div>
    </div>
  );
};

export default JobCard;
