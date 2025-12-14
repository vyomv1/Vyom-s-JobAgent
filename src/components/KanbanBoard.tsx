
import React, { useState } from 'react';
import { Job } from '../types';
import JobCard from './JobCard';
import { Bookmark, Send, Users, Trophy } from 'lucide-react';

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

  const columns: { id: Job['status'], title: string, icon: React.ReactNode, count: number }[] = [
      { id: 'saved', title: 'Saved', icon: <Bookmark size={14} />, count: jobs.filter(j => j.status === 'saved').length },
      { id: 'applied', title: 'Applied', icon: <Send size={14} />, count: jobs.filter(j => j.status === 'applied').length },
      { id: 'interview', title: 'Interview', icon: <Users size={14} />, count: jobs.filter(j => j.status === 'interview').length },
      { id: 'offer', title: 'Offer', icon: <Trophy size={14} />, count: jobs.filter(j => j.status === 'offer').length },
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedJobId(id);
      e.dataTransfer.effectAllowed = "move";
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
    // Removed -ml-6 because the parent container is w-full (no padding).
    // The spacer handles the indentation.
    <div className="flex gap-4 overflow-x-auto w-full pb-8 pt-2 items-start h-full scrollbar-hide">
      
      {/* Spacer to align with "Pipeline" title (max-w-[1024px] px-6) */}
      <div className="shrink-0 w-[calc(50vw-512px+24px)] hidden min-[1024px]:block"></div>
      <div className="shrink-0 w-6 min-[1024px]:hidden"></div>

      {columns.map(col => {
            const colJobs = jobs.filter(j => j.status === col.id);
            return (
                <div 
                    key={col.id}
                    className="flex flex-col min-w-[320px] max-w-[320px] bg-[#E8E8ED]/50 rounded-[16px] p-2 h-full border border-white/50 backdrop-blur-sm"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    <div className="flex items-center justify-between p-3 mb-1 shrink-0">
                        <h3 className="font-semibold text-[13px] text-[#1d1d1f] flex items-center gap-2">
                            {col.icon} {col.title}
                        </h3>
                        <span className="text-[10px] font-bold text-[#86868b] bg-white px-2 py-0.5 rounded-full shadow-sm">{col.count}</span>
                    </div>
                    
                    <div className="flex-1 space-y-2 overflow-y-auto px-1 pb-4 custom-scrollbar">
                        {colJobs.length === 0 && (
                            <div className="h-20 border-2 border-dashed border-[#d2d2d7]/50 rounded-lg flex items-center justify-center">
                                <span className="text-[10px] text-[#86868b] font-medium">Empty</span>
                            </div>
                        )}
                        {colJobs.map(job => (
                            <div
                                key={job.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, job.id)}
                                className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform"
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
      
      {/* Trailing padding for scroll */}
      <div className="shrink-0 w-6"></div>
    </div>
  );
};

export default KanbanBoard;
