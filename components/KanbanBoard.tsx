
import React, { useState } from 'react';
import { Job } from '../types';
import JobCard from './JobCard';
import { Bookmark, Send, Users, Trophy, Plus } from 'lucide-react';

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

  // Filter jobs by status - Using uniform neutral background
  const columns: { id: Job['status'], title: string, icon: React.ReactNode, bgClass: string, accentColor: string }[] = [
      { id: 'saved', title: 'Saved', icon: <Bookmark size={18} />, bgClass: 'bg-[#F8F9FA]', accentColor: 'text-[#1a73e8]' },
      { id: 'applied', title: 'Applied', icon: <Send size={18} />, bgClass: 'bg-[#F8F9FA]', accentColor: 'text-[#1a73e8]' },
      { id: 'interview', title: 'Interview', icon: <Users size={18} />, bgClass: 'bg-[#F8F9FA]', accentColor: 'text-[#F4B400]' },
      { id: 'offer', title: 'Offer', icon: <Trophy size={18} />, bgClass: 'bg-[#F8F9FA]', accentColor: 'text-[#0F9D58]' },
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
    <div className="flex flex-col h-full min-h-[750px]">
      
      {/* HEADER WITH ADD ACTION */}
      <div className="mb-8 mx-2 shrink-0 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#202124]">Application Pipeline</h2>
          <button 
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1a73e8] text-white rounded-full font-bold text-sm hover:bg-[#1557B0] transition-all shadow-sm active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#D2E3FC]"
          >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Job</span>
              <span className="sm:hidden">Add</span>
          </button>
      </div>

      {/* BOARD COLUMNS */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-6 items-stretch px-2 custom-scrollbar snap-x snap-mandatory">
        {columns.map(col => {
            const colJobs = jobs.filter(j => j.status === col.id);
            return (
                <div 
                    key={col.id}
                    className={`flex flex-col h-full min-w-[340px] rounded-[32px] p-4 transition-colors ${col.bgClass} border border-[#DADCE0] snap-center`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    <div className={`flex items-center justify-between mb-6 px-4 pt-2 ${col.accentColor}`}>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            {col.icon} {col.title}
                        </h3>
                        <span className="text-xs bg-white border border-[#DADCE0] px-2.5 py-1 rounded-full font-bold shadow-sm text-[#5F6368]">{colJobs.length}</span>
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
    </div>
  );
};

export default KanbanBoard;
