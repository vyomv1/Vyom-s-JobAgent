
import React, { useState } from 'react';
import { Job } from '../types';
import { CheckCircle, AlertTriangle, Briefcase, MapPin, ExternalLink, FileText, TrendingUp, Check, Trash2, Clock, Zap, Award } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onGenerateKit: (job: Job) => void;
  onToggleStatus: (id: string, currentStatus: 'new' | 'applied') => void;
  onDelete: (id: string) => void;
}

const ScoreGauge: React.FC<{ score: number, isApplied: boolean }> = ({ score, isApplied }) => {
    // Semi-circle Gauge configuration
    // ViewBox: 0 0 100 60
    // Center: 50, 50
    // Radius: 40
    const radius = 40;
    const stroke = 6; // Thicker stroke
    const normalizedScore = Math.min(100, Math.max(0, score));
    const arcLength = Math.PI * radius;
    const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;
    
    let color = '#86BC25'; // Deloitte Green
    if (score < 50) color = '#ef4444'; // Red
    else if (score < 75) color = '#f97316'; // Orange
    if (isApplied) color = '#9ca3af'; // Gray

    return (
        <div className="relative w-24 h-16 flex flex-col items-center justify-start">
            <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="xMidYMax meet">
                {/* Background Track: M (StartX) (StartY) A (RX) (RY) (Rot) (LargeArc) (Sweep) (EndX) (EndY) */}
                {/* Start at 10,50. Arc to 90,50. Radius 40. */}
                <path 
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                />
                {/* Progress Arc */}
                <path 
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={arcLength}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            
            {/* Centered Text Overlay */}
            {/* Moved top from 45% to 60% to give more space from the arch */}
            <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center w-full">
                <span className={`text-2xl font-bold leading-none tracking-tight ${isApplied ? 'text-gray-400' : 'text-black'}`}>
                    {score}
                </span>
            </div>
            
            {/* Label below the arc baseline */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 text-center w-full">
                 <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest block">Match</span>
            </div>
        </div>
    );
};

const JobCard: React.FC<JobCardProps> = ({ job, onGenerateKit, onToggleStatus, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const analysis = job.analysis;
  const isApplied = job.status === 'applied';

  // Fallback URL if extraction fails
  const applyUrl = job.url || `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} jobs`)}`;

  return (
    <div className={`group relative border transition-all duration-300 bg-white shadow-sm hover:shadow-lg mb-4 ${expanded ? 'border-l-4 border-l-[#86BC25] border-y-gray-200 border-r-gray-200' : 'border-gray-200 hover:border-gray-300'} ${isApplied ? 'opacity-75 bg-gray-50' : ''}`}>
      
      {/* Selection Overlay/Checkbox */}
      <div className="absolute top-5 right-5 z-10 flex flex-col items-end gap-2">
         <div className="flex items-center gap-3">
             <button 
                onClick={() => onDelete(job.id)}
                className="text-gray-300 hover:text-red-600 transition-colors p-1"
                title="Remove this job"
             >
                <Trash2 size={16} />
             </button>

             <label className="flex items-center gap-2 cursor-pointer group/check">
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isApplied ? 'text-[#86BC25]' : 'text-gray-300 group-hover/check:text-gray-500'}`}>
                  {isApplied ? 'Applied' : 'Mark Applied'}
                </span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={isApplied} 
                    onChange={() => onToggleStatus(job.id, job.status || 'new')}
                    className="peer sr-only" 
                  />
                  <div className={`w-6 h-6 border-2 rounded-sm flex items-center justify-center transition-all ${isApplied ? 'bg-[#86BC25] border-[#86BC25]' : 'bg-white border-gray-300 hover:border-[#86BC25]'}`}>
                    <Check size={14} className={`text-white transition-opacity ${isApplied ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
                  </div>
                </div>
             </label>
         </div>
      </div>

      <div className="p-6">
        <div className="flex gap-6">
          {/* Gauge Score */}
          <div className="shrink-0 w-24 flex justify-center pt-1">
             {analysis ? (
                 <ScoreGauge score={analysis.score} isApplied={isApplied} />
             ) : (
                 <div className="w-20 h-14 rounded-t-full border-2 border-dashed border-b-0 border-gray-300 flex items-end justify-center pb-2 animate-pulse">
                     <span className="text-[10px] text-gray-400 font-bold uppercase">Analyzing</span>
                 </div>
             )}
          </div>

          <div className="flex-1 pr-24">
            {/* Header Content */}
            <div className="mb-2">
                <div className="flex items-start gap-2">
                  <h3 className="text-xl font-bold text-black group-hover:text-[#86BC25] transition-colors leading-tight">
                      {job.title}
                  </h3>
                  {job.isRelatedDiscovery && (
                    <span className="text-amber-500" title="Found via Recursive Discovery">
                      <Zap size={16} fill="currentColor" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600 font-medium mt-1">
                  <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-gray-400" /> {job.company}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> {job.location}</span>
                </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
               {job.seniorityScore && (
                 <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                   job.seniorityScore === 'Lead' || job.seniorityScore === 'Senior' 
                     ? 'bg-black text-white border-black' 
                     : 'bg-white text-gray-600 border-gray-300'
                 }`}>
                   <Award size={10} /> {job.seniorityScore} Level
                 </span>
               )}
               {analysis && !isApplied && analysis.isHighValue && (
                 <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#86BC25] uppercase tracking-wider flex items-center gap-1">
                   <TrendingUp size={10} /> High Priority
                 </span>
               )}
               {analysis && !isApplied && analysis.isCommuteRisk && (
                 <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-600 uppercase tracking-wider flex items-center gap-1">
                   <AlertTriangle size={10} /> Commute Risk
                 </span>
               )}
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border border-gray-200 px-1.5 py-0.5 rounded-sm bg-gray-50">{job.source}</span>
               {job.postedDate && !isApplied && (
                   <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                       <Clock size={10} /> {job.postedDate}
                   </span>
               )}
               {job.isRelatedDiscovery && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 border border-amber-200">
                    Discovery
                  </span>
               )}
            </div>

            {/* Verdict */}
            <div className="pt-2 border-t border-gray-50">
               {analysis ? (
                   <p className="text-sm text-gray-700 font-medium leading-relaxed flex items-start gap-2">
                     <CheckCircle size={16} className={`shrink-0 ${isApplied ? 'text-gray-300' : 'text-[#86BC25]'} mt-0.5`} />
                     {analysis.verdict}
                   </p>
               ) : (
                   <p className="text-sm text-gray-400 italic flex items-center gap-2">
                       <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                       Analyzing role requirements...
                   </p>
               )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-6 pl-[6.5rem]">
           <button 
             onClick={() => setExpanded(!expanded)}
             disabled={!analysis}
             className={`text-xs font-bold uppercase tracking-wider underline decoration-gray-300 hover:decoration-black underline-offset-4 ${!analysis ? 'text-gray-300 cursor-not-allowed no-underline' : 'text-gray-500 hover:text-black'}`}
           >
             {expanded ? 'Hide Role Summary' : 'Show Role Summary'}
           </button>
           
           <div className="flex gap-3">
             {!isApplied && (
               <button 
                 onClick={() => onGenerateKit(job)}
                 disabled={!analysis}
                 className="px-4 py-2 text-xs font-bold text-black bg-[#86BC25] hover:bg-[#75a621] disabled:bg-gray-200 disabled:text-gray-400 rounded-sm shadow-sm flex items-center gap-2 transition-colors uppercase tracking-wider"
               >
                 <FileText size={14} />
                 Draft Strategy Kit
               </button>
             )}
             
             <a 
               href={applyUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               className="px-4 py-2 text-xs font-bold text-black bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-900 rounded-sm flex items-center gap-2 transition-colors uppercase tracking-wider"
             >
               Apply Now <ExternalLink size={12} />
             </a>
           </div>
        </div>
      </div>

      {expanded && analysis && (
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 ml-[6.5rem]">
          <h4 className="text-xs font-bold text-black uppercase tracking-widest mb-3">Application Strategy</h4>
          <p className="text-sm text-gray-700 mb-6 leading-relaxed">{analysis.strategy}</p>
          
          <h4 className="text-xs font-bold text-black uppercase tracking-widest mb-3">Keywords Detected</h4>
          <div className="flex flex-wrap gap-2 mb-6">
            {analysis.matchedKeywords.map((kw, i) => (
              <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-300 px-2 py-1 text-gray-600">
                {kw}
              </span>
            ))}
          </div>

          <h4 className="text-xs font-bold text-black uppercase tracking-widest mb-3">Role Summary</h4>
          <p className="text-sm text-gray-600">{job.summary}</p>
        </div>
      )}
    </div>
  );
};

export default JobCard;
