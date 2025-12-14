
import React from 'react';
import { Job } from '../types';
import { AlertTriangle, Briefcase, MapPin, ExternalLink, FileText, TrendingUp, Trash2, Clock, Zap, Bookmark, Archive } from 'lucide-react';

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

  if (isKanban) {
      return (
        <div 
            className="bg-white p-4 rounded-2xl shadow-sm border border-[#DADCE0] hover:shadow-md transition-all group flex flex-col gap-3 relative cursor-pointer hover:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#1a73e8] outline-none"
            tabIndex={0}
            role="button"
            aria-label={`View details for ${job.title} at ${job.company}`}
            onClick={() => onOpenDetail(job)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenDetail(job);
                }
            }}
        >
            <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-sm text-[#202124] leading-snug line-clamp-2 group-hover:text-[#1a73e8] transition-colors">
                    {job.title}
                </h4>
                {analysis && (
                    <div 
                        className={`shrink-0 w-2 h-2 rounded-full ${analysis.isHighValue ? 'bg-[#34A853]' : 'bg-[#DADCE0]'}`} 
                        title={analysis.isHighValue ? "High Value" : "Standard"}
                        aria-label={analysis.isHighValue ? "High Value Job" : "Standard Job"}
                    ></div>
                )}
            </div>
            
            <p className="text-xs font-medium text-[#5F6368] line-clamp-1">{job.company}</p>
            
            <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[#F1F3F4]">
                <button 
                    onClick={(e) => { e.stopPropagation(); onOpenDetail(job); }} 
                    className="w-full py-2 text-xs font-bold text-[#70757A] hover:bg-[#E8F0FE] hover:text-[#1967D2] rounded-md transition-colors bg-[#F1F3F4] flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-1"
                    aria-label="View Details"
                >
                    <FileText size={14} aria-hidden="true" /> View Details
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className={`bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-[#DADCE0] relative group overflow-hidden ${status === 'archived' ? 'opacity-50 grayscale' : ''}`}>
      
      {/* Top Right Actions */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
         <button 
            onClick={() => onDelete(job.id)} 
            className="p-2.5 text-[#70757A] hover:text-[#DB4437] hover:bg-[#FCE8E6] rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#DB4437]" 
            title={status === 'archived' ? "Delete Permanently" : "Archive"}
            aria-label={status === 'archived' ? "Delete Permanently" : "Archive Job"}
         >
            {status === 'archived' ? <Trash2 size={18} aria-hidden="true" /> : <Archive size={18} aria-hidden="true" />}
         </button>
         
         {status !== 'archived' && (
             <button 
                onClick={() => onToggleStatus(job.id, status)}
                className={`p-2.5 rounded-full transition-all border focus:outline-none focus:ring-2 focus:ring-[#1a73e8] ${isSavedOrBetter 
                    ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-md' 
                    : 'bg-white text-[#70757A] border-[#DADCE0] hover:border-[#5F6368]'}`}
                aria-label={isSavedOrBetter ? "Unsave Job" : "Save Job"}
             >
                 <Bookmark size={18} fill={isSavedOrBetter ? "currentColor" : "none"} aria-hidden="true" />
             </button>
         )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
          {/* Score Circle */}
          <div className="shrink-0" aria-hidden="true">
             {analysis ? (
                 <div className="w-20 h-20 rounded-full bg-[#E8F0FE] text-[#1967D2] flex flex-col items-center justify-center border-4 border-white shadow-sm ring-1 ring-[#D2E3FC]">
                    <span className="text-2xl font-black tracking-tight">{analysis.score}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Score</span>
                 </div>
             ) : (
                 <div className="w-20 h-20 rounded-full bg-[#F1F3F4] border-4 border-white shadow-sm flex items-center justify-center animate-pulse">
                     <span className="text-[10px] font-bold text-[#70757A]">SCAN</span>
                 </div>
             )}
          </div>

          <div className="flex-1 pr-12">
             <div 
                className="cursor-pointer group/title focus:outline-none" 
                onClick={() => onOpenDetail(job)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenDetail(job);
                    }
                }}
             >
                <h3 className="text-2xl font-bold text-[#202124] group-hover/title:text-[#1a73e8] transition-colors leading-tight mb-2 flex items-start gap-2">
                    {job.title}
                    {job.isRelatedDiscovery && <Zap size={18} className="text-[#F4B400] fill-[#F4B400] mt-1" aria-label="Related Discovery" />}
                </h3>
                <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-[#5F6368]">
                    <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-[#70757A]" aria-hidden="true" /> {job.company}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-[#70757A]" aria-hidden="true" /> {job.location}</span>
                    {job.postedDate && <span className="flex items-center gap-1.5"><Clock size={16} className="text-[#70757A]" aria-hidden="true" /> {job.postedDate}</span>}
                </div>
             </div>

             {/* Tags - Always Visible with Google Colors */}
             <div className="flex flex-wrap items-center gap-2 mt-4 mb-6" aria-label="Job Tags">
                {job.seniorityScore && (
                     <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F0FE] text-[#1967D2] border border-[#D2E3FC]">{job.seniorityScore}</span>
                )}
                {analysis && analysis.isHighValue && (
                     <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] flex items-center gap-1"><TrendingUp size={14} aria-hidden="true" /> High Value</span>
                )}
                {analysis && analysis.isCommuteRisk && (
                     <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF] flex items-center gap-1"><AlertTriangle size={14} aria-hidden="true" /> Commute Risk</span>
                )}
                 {analysis?.industry && (
                     <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF8E1] text-[#B06000] border border-[#FEEFC3]">{analysis.industry}</span>
                )}
             </div>

             {/* Verdict - Clean text, no box */}
             {analysis ? (
                 <div className="mt-2 mb-6">
                    <p className="text-sm text-[#3C4043] leading-relaxed font-medium">{analysis.verdict}</p>
                 </div>
             ) : (
                 <div className="space-y-2 max-w-md" aria-busy="true" aria-label="Loading analysis">
                     <div className="h-2 bg-[#F1F3F4] rounded-full w-full animate-pulse"></div>
                     <div className="h-2 bg-[#F1F3F4] rounded-full w-2/3 animate-pulse"></div>
                 </div>
             )}

             {/* Actions */}
             <div className="flex items-center gap-4 mt-6">
                 <a 
                    href={applyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#1a73e8] text-white hover:bg-[#1557B0] hover:shadow-lg transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2"
                    aria-label={`Apply for ${job.title} at ${job.company} on external site`}
                 >
                     {getAbsoluteUrl(job.url) ? 'Apply Now' : 'Search Google'} <ExternalLink size={18} aria-hidden="true" />
                 </a>
             </div>
          </div>
      </div>
    </div>
  );
};

export default JobCard;
