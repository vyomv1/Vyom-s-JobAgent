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
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ jobs, onGenerateKit, onToggleStatus, onDelete, onOpenDetail }) => {
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);

  // Filter jobs by status
  const columns: { id: Job['status'], title: string, icon: React.ReactNode, bgClass: string, accentColor: string }[] = [
      { id: 'saved', title: 'Saved', icon: <Bookmark size={18} />, bgClass: 'bg-[#F1F3F4]', accentColor: 'text-blue-600' },
      { id: 'applied', title: 'Applied', icon: <Send size={18} />, bgClass: 'bg-[#E8F0FE]', accentColor: 'text-blue-700' },
      { id: 'interview', title: 'Interview', icon: <Users size={18} />, bgClass: 'bg-[#FFF8E1]', accentColor: 'text-orange-600' },
      { id: 'offer', title: 'Offer', icon: <Trophy size={18} />, bgClass: 'bg-[#E6F4EA]', accentColor: 'text-green-600' },
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedJobId(id);
      e.dataTransfer.effectAllowed = "move";
      // Create a ghost image if desired, otherwise browser default
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
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
    <div className="flex gap-6 h-full min-h-[700px] overflow-x-auto pb-6 items-stretch px-2">
      {columns.map(col => {
          const colJobs = jobs.filter(j => j.status === col.id);
          return (
            <div 
                key={col.id}
                className={`flex flex-col h-full min-w-[340px] rounded-[32px] p-4 transition-colors ${col.bgClass}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
            >
                <div className={`flex items-center justify-between mb-6 px-4 pt-2 ${col.accentColor}`}>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {col.icon} {col.title}
                    </h3>
                    <span className="text-xs bg-white/80 px-2.5 py-1 rounded-full font-bold shadow-sm">{colJobs.length}</span>
                </div>
                
                <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                    {colJobs.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-[#DADCE0] rounded-[24px]">
                            <p className="text-sm font-medium text-[#70757A]">Drag jobs here</p>
                        </div>
                    )}
                    {colJobs.map(job => (
                         <div
                            key={job.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, job.id)}
                            className="cursor-grab active:cursor-grabbing"
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
    </div>
  );
};

export default KanbanBoard;