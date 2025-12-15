import React from 'react';
import { Job } from '../types';
import { Briefcase, MapPin, ExternalLink, Trash2, Bookmark, Archive, Zap, ArrowRight, TrendingUp } from 'lucide-react';

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
  
  const getAbsoluteUrl = (url?: string) => {
      if (!url || url === 'Manual Entry') return null;
      return url.startsWith('http') ? url : `https://${url}`;
  };

  const applyUrl = getAbsoluteUrl(job.url) || `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}`;

  // Tiny Card for Kanban - Ultra Compact
  if (isKanban) {
      return (
        <div 
            className="bg-white dark:bg-[#1C1C1E] rounded-[12px] p-4 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)] transition-all flex flex-col gap-2 border border-transparent hover:border-[#0071e3]/30 dark:hover:border-[#0A84FF]/30 dark:border-white/5"
            onClick={() => onOpenDetail(job)}
        >
            <div className="flex justify-between items-start gap-1">
                <h4 className="font-bold text-[15px] text-[#1d1d1f] dark:text-[#f5f5f7] leading-snug line-clamp-2">
                    {job.title}
                </h4>
            </div>
            
            <p className="text-[13px] text-[#86868b] dark:text-[#98989D] font-medium truncate">{job.company}</p>
            
            <div className="flex items-center justify-between mt-2">
                 {analysis?.score ? (
                     <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${analysis.score > 70 ? 'bg-[#E6F4EA] dark:bg-[#1e3a29] text-[#137333] dark:text-[#45D469]' : 'bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#5F6368] dark:text-[#98989D]'}`}>
                        {analysis.score}%
                     </span>
                 ) : (
                    <span className="text-[10px] text-[#d2d2d7] dark:text-[#555]">No Score</span>
                 )}
                 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: job.seniorityScore === 'Senior' || job.seniorityScore === 'Lead' ? '#34C759' : '#FFCC00' }}></div>
            </div>
        </div>
      );
  }

  // Full "Bento" Card for Dashboard
  return (
    <div 
        onClick={() => onOpenDetail(job)}
        className={`apple-card p-8 group cursor-pointer border border-transparent relative hover:border-[#0071e3]/10 dark:hover:border-[#0A84FF]/20 ${status === 'archived' ? 'opacity-60 grayscale' : ''}`}
    >
      
      {/* Top Right Actions (No Overlap) */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
         {status !== 'archived' && (
             <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(job.id, status); }}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors shadow-sm ${isSavedOrBetter 
                    ? 'bg-[#0071e3] text-white hover:bg-[#0077ED] dark:bg-[#0A84FF]' 
                    : 'bg-white dark:bg-[#2C2C2E] text-[#86868b] border border-[#d2d2d7] dark:border-[#38383A] hover:border-[#0071e3] hover:text-[#0071e3] dark:hover:border-[#0A84FF] dark:hover:text-[#0A84FF]'}`}
                title={isSavedOrBetter ? "Saved" : "Save Job"}
             >
                 <Bookmark size={16} fill={isSavedOrBetter ? "currentColor" : "none"} />
             </button>
         )}
         
         <button 
            onClick={(e) => { e.stopPropagation(); onDelete(job.id); }} 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-[#2C2C2E] border border-[#d2d2d7] dark:border-[#38383A] hover:bg-[#FF3B30] hover:text-white hover:border-[#FF3B30] text-[#86868b] transition-colors shadow-sm"
            title="Archive"
         >
            {status === 'archived' ? <Trash2 size={16} /> : <Archive size={16} />}
         </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
          
          {/* Main Content */}
          <div className="flex-1 pr-12">
             <div className="mb-2 flex items-center gap-3">
                 <h3 className="text-[22px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight group-hover:text-[#0071e3] dark:group-hover:text-[#0A84FF] transition-colors">
                    {job.title}
                 </h3>
                 {job.isRelatedDiscovery && <span className="bg-[#FFCC00] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>}
             </div>
             
             <div className="flex items-center gap-4 text-[13px] font-medium text-[#86868b] dark:text-[#98989D] mb-5">
                <span className="flex items-center gap-1.5"><Briefcase size={14}/> {job.company}</span>
                <span className="w-1 h-1 bg-[#d2d2d7] dark:bg-[#38383A] rounded-full"></span>
                <span className="flex items-center gap-1.5"><MapPin size={14}/> {job.location}</span>
                <span className="w-1 h-1 bg-[#d2d2d7] dark:bg-[#38383A] rounded-full"></span>
                <span>{job.postedDate}</span>
             </div>

             {/* Chip Row */}
             <div className="flex flex-wrap items-center gap-2 mb-6">
                {/* Match Badge Replaces Ring */}
                {analysis?.score && (
                     <span className={`px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1 ${analysis.score > 70 ? 'bg-[#1d1d1f] dark:bg-[#f5f5f7] text-white dark:text-black' : 'bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#1d1d1f] dark:text-[#f5f5f7]'}`}>
                        <Zap size={12} fill={analysis.score > 70 ? "currentColor" : "none"} /> {analysis.score}% Match
                     </span>
                )}
                {analysis?.industry && (
                     <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#E8F2FF] dark:bg-[#122438] text-[#0071e3] dark:text-[#409CFF]">{analysis.industry}</span>
                )}
                {analysis?.isHighValue && (
                     <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#E6F4EA] dark:bg-[#1e3a29] text-[#34C759] flex items-center gap-1"><TrendingUp size={12}/> High Value</span>
                )}
                 {job.seniorityScore && (
                     <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#1d1d1f] dark:text-[#f5f5f7]">{job.seniorityScore}</span>
                )}
             </div>

             {/* Verdict - Clean text block */}
             {analysis && (
                 <p className="text-[15px] text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed max-w-2xl mb-6 font-normal">
                    {analysis.verdict}
                 </p>
             )}

             {/* Call to Actions - Removed View Strategy Button */}
             <div className="flex items-center gap-4">
                 <a 
                    href={applyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="apple-button px-6 py-2.5 text-[13px] font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
                 >
                     {getAbsoluteUrl(job.url) ? 'Apply Now' : 'Google Search'} <ExternalLink size={14} />
                 </a>
             </div>
          </div>
      </div>
    </div>
  );
};

export default JobCard;