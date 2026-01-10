import React from 'react';
import { Job } from '../types';
import { Briefcase, MapPin, Trash2, Bookmark, Archive, Zap, Users, Clock, Flame, CheckCircle2, MoreHorizontal, Calendar } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onOpenDetail: (job: Job, tab?: 'brief' | 'strategy') => void;
  onToggleStatus: (id: string, currentStatus: Job['status']) => void;
  onDelete: (id: string) => void;
  isKanban?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isSelectMode?: boolean;
}

const FollowUpTimer = ({ appliedDate }: { appliedDate?: string }) => {
    if (!appliedDate) return null;
    const applied = new Date(appliedDate);
    const now = new Date();
    const diffTime = now.getTime() - applied.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    const followUpDay = 7;
    const remaining = followUpDay - diffDays;

    if (remaining <= 0) return <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 animate-pulse bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded"><Flame size={12} /> FOLLOW UP NOW</span>;
    return <span className="text-[10px] font-bold text-apple-gray flex items-center gap-1 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded"><Clock size={10} /> {remaining}d left</span>;
};

const ScoreRing = ({ score }: { score: number }) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    let color = '#E5E5EA'; // Gray
    if (score >= 85) color = '#34C759'; // Green
    else if (score >= 70) color = '#0071e3'; // Blue
    else if (score >= 50) color = '#FFCC00'; // Yellow

    return (
        <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-200 dark:text-white/10" />
                <circle 
                    cx="20" 
                    cy="20" 
                    r={radius} 
                    stroke={color} 
                    strokeWidth="3" 
                    fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset} 
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-[10px] font-bold text-apple-text dark:text-white">{score}</span>
        </div>
    );
};

const JobCard: React.FC<JobCardProps> = ({ job, onOpenDetail, onToggleStatus, onDelete, isKanban, isSelected, onSelect, isSelectMode }) => {
  const analysis = job.analysis;
  const status = job.status || 'new';
  const isSavedOrBetter = ['saved', 'applied', 'assessment', 'interview', 'offer'].includes(status);
  const score = analysis?.score || 0;
  
  const interviewDate = job.interviewDate ? new Date(job.interviewDate) : null;
  const interviewStr = interviewDate ? interviewDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  // Kanban View: Compact, Information Dense
  if (isKanban) {
      return (
        <div 
            className="bg-white dark:bg-[#1C1C1E] rounded-[16px] p-4 cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col gap-3 border border-black/5 dark:border-white/5 hover:border-apple-blue/30 group"
            onClick={() => onOpenDetail(job)}
        >
            <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-[13px] text-apple-text dark:text-white leading-snug line-clamp-2">{job.title}</h4>
                {score > 0 && (
                    <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-gray-100 text-gray-600 dark:bg-white/10'}`}>
                        {score}%
                    </span>
                )}
            </div>
            
            <div className="flex flex-col gap-1">
                <p className="text-[12px] text-apple-gray dark:text-gray-400 font-medium truncate">{job.company}</p>
                <div className="flex items-center gap-2 flex-wrap">
                    {job.seniorityScore && (
                         <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: job.seniorityScore === 'Senior' || job.seniorityScore === 'Lead' ? '#34C759' : '#FFCC00' }}></div>
                            <span className="text-[10px] text-apple-gray">{job.seniorityScore}</span>
                         </div>
                    )}
                    {interviewDate && (
                         <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Calendar size={10} /> {interviewStr}
                         </span>
                    )}
                </div>
            </div>

            {status === 'applied' && (
                <div className="pt-2 border-t border-gray-100 dark:border-white/5 mt-auto">
                    <FollowUpTimer appliedDate={job.appliedDate} />
                </div>
            )}
        </div>
      );
  }

  // Dashboard View: Rich Card
  return (
    <div 
        onClick={() => isSelectMode ? onSelect?.(job.id) : onOpenDetail(job)}
        className={`apple-card p-0 group cursor-pointer border relative transition-all duration-300 overflow-hidden flex flex-col
            ${isSelected ? 'ring-2 ring-apple-blue border-apple-blue transform scale-[1.01]' : 'border-black/5 dark:border-white/5'} 
            ${status === 'archived' ? 'opacity-60 grayscale' : 'bg-white dark:bg-[#1C1C1E]'}
        `}
    >
      {/* High Value Stripe */}
      {analysis?.isHighValue && <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600"></div>}

      <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
             <div className="flex-1 pr-4">
                 <h3 className="text-[17px] font-bold tracking-tight text-apple-text dark:text-white group-hover:text-apple-blue transition-colors leading-tight mb-1.5">{job.title}</h3>
                 <div className="flex items-center gap-2 text-[13px] font-medium text-apple-gray dark:text-gray-400">
                    <span className="flex items-center gap-1.5 text-black dark:text-gray-200"><Briefcase size={12}/> {job.company}</span>
                    <span className="text-gray-300 dark:text-white/20">•</span>
                    <span className="flex items-center gap-1.5"><MapPin size={12}/> {job.location}</span>
                 </div>
             </div>
             
             {/* Score Visual or Selection Checkbox */}
             <div className="shrink-0">
                {isSelectMode ? (
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-apple-blue border-apple-blue text-white' : 'border-gray-300 dark:border-gray-600 bg-transparent'}`}>
                        {isSelected && <CheckCircle2 size={14} />}
                     </div>
                ) : (
                    <ScoreRing score={score} />
                )}
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {job.seniorityScore && (
                 <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 rounded-md text-[11px] font-semibold text-apple-gray dark:text-gray-300 flex items-center gap-1.5 border border-transparent dark:border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: job.seniorityScore === 'Senior' || job.seniorityScore === 'Lead' ? '#34C759' : '#FFCC00' }}></div>
                    {job.seniorityScore}
                 </span>
            )}
            {analysis?.isHighValue && <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-100 dark:border-emerald-500/20"><Zap size={10} fill="currentColor"/> HIGH VALUE</span>}
            {interviewDate && (
                 <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-purple-100 dark:border-purple-500/20">
                     <Calendar size={10} /> {interviewStr}
                 </span>
            )}
            {status === 'applied' && <FollowUpTimer appliedDate={job.appliedDate} />}
          </div>

          <div className="mt-auto">
             <p className="text-[13px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed opacity-90">{analysis?.verdict || job.summary}</p>
          </div>
      </div>

      {/* Floating Actions - Only visible on hover/focus */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-10">
         {!isSelectMode && status !== 'archived' && (
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(job.id, status); }} 
                className={`w-8 h-8 flex items-center justify-center rounded-full shadow-lg border border-black/5 dark:border-white/10 transition-transform hover:scale-110 ${isSavedOrBetter ? 'bg-apple-blue text-white border-transparent' : 'bg-white dark:bg-[#2C2C2E] text-apple-gray'}`}
                title={isSavedOrBetter ? "Unsave" : "Save Job"}
            >
                <Bookmark size={14} fill={isSavedOrBetter ? "currentColor" : "none"} />
            </button>
         )}
         {!isSelectMode && (
             <button 
                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 shadow-lg text-apple-gray hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all hover:scale-110"
                title="Archive/Delete"
             >
                {status === 'archived' ? <Trash2 size={14} /> : <Archive size={14} />}
             </button>
         )}
      </div>
    </div>
  );
};

export default JobCard;