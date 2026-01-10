import React, { useState } from 'react';
import { Job } from '../types';
import JobCard from './JobCard';
import { Bookmark, Send, Users, Trophy, ClipboardList, Plus } from 'lucide-react';

interface KanbanBoardProps {
  jobs: Job[];
  onGenerateKit: (job: Job) => void;
  onToggleStatus: (id: string, status: Job['status']) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (job: Job) => void;
  onOpenAddModal: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ jobs, onGenerateKit, onToggleStatus, onDelete, onOpenDetail, onOpenAddModal }) => {
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);

  const columns: { id: Job['status'], title: string, icon: React.ReactNode, count: number, color: string }[] = [
      { id: 'saved', title: 'Saved', icon: <Bookmark size={14} />, count: jobs.filter(j => j.status === 'saved').length, color: 'bg-gray-500' },
      { id: 'applied', title: 'Applied', icon: <Send size={14} />, count: jobs.filter(j => j.status === 'applied').length, color: 'bg-blue-500' },
      { id: 'assessment', title: 'Assessment', icon: <ClipboardList size={14} />, count: jobs.filter(j => j.status === 'assessment').length, color: 'bg-purple-500' },
      { id: 'interview', title: 'Interview', icon: <Users size={14} />, count: jobs.filter(j => j.status === 'interview').length, color: 'bg-orange-500' },
      { id: 'offer', title: 'Offer', icon: <Trophy size={14} />, count: jobs.filter(j => j.status === 'offer').length, color: 'bg-green-500' },
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedJobId(id);
      e.dataTransfer.effectAllowed = "move";
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: Job['status']) => {
      e.preventDefault();
      if (draggedJobId) {
          onToggleStatus(draggedJobId, status);
          setDraggedJobId(null);
      }
  };

  return (
    <div className="flex gap-4 sm:gap-6 overflow-x-auto w-full pb-8 items-start h-full scrollbar-hide px-4 sm:px-6 snap-x snap-mandatory">
      {columns.map(col => {
            const colJobs = jobs.filter(j => j.status === col.id);
            return (
                <div 
                    key={col.id}
                    className="flex flex-col min-w-[300px] sm:min-w-[340px] max-w-[340px] h-full rounded-[24px] bg-[#f5f5f7]/60 dark:bg-[#1C1C1E]/60 border border-white/50 dark:border-white/5 backdrop-blur-xl transition-colors ring-1 ring-black/5 snap-center"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    <div className="flex items-center justify-between p-5 mb-0 shrink-0 sticky top-0 bg-transparent z-10">
                        <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                             <h3 className="font-bold text-[15px] text-[#1d1d1f] dark:text-white tracking-tight">
                                {col.title}
                             </h3>
                        </div>
                        <span className="text-[11px] font-bold text-[#86868b] dark:text-[#98989D] bg-white dark:bg-[#2C2C2E] px-2.5 py-1 rounded-full shadow-sm border border-black/5 dark:border-white/5">{col.count}</span>
                    </div>
                    
                    <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 custom-scrollbar">
                        {colJobs.length === 0 && (
                            <div className="h-32 border-2 border-dashed border-[#d2d2d7]/50 dark:border-[#38383A] rounded-2xl flex flex-col items-center justify-center gap-2 group cursor-default">
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-full text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors">
                                    <Plus size={20} />
                                </div>
                                <span className="text-[11px] text-[#86868b] dark:text-[#98989D] font-medium">Empty Stage</span>
                            </div>
                        )}
                        {colJobs.map(job => (
                            <div
                                key={job.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, job.id)}
                                className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${draggedJobId === job.id ? 'opacity-30 scale-95 rotate-3 grayscale' : 'hover:scale-[1.02] hover:-translate-y-1'}`}
                            >
                                <JobCard 
                                    job={job} 
                                    onOpenDetail={onOpenDetail}
                                    onToggleStatus={(id, st) => onToggleStatus(id, st)} 
                                    onDelete={onDelete} 
                                    isKanban={true}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );
      })}
      <div className="shrink-0 w-2 sm:w-6"></div>
    </div>
  );
};

export default KanbanBoard;