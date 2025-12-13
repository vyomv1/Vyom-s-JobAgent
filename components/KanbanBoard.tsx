
import React, { useState } from 'react';
import { Job } from '../types';
import JobCard from './JobCard';
import { Bookmark, Send, Users, Trophy, Link, Plus } from 'lucide-react';

interface KanbanBoardProps {
  jobs: Job[];
  onGenerateKit: (job: Job) => void;
  onToggleStatus: (id: string, status: Job['status']) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (job: Job) => void;
  onAddJob: (url: string) => Promise<void>;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ jobs, onGenerateKit, onToggleStatus, onDelete, onOpenDetail, onAddJob }) => {
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [newJobUrl, setNewJobUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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

  const handleAddSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newJobUrl.trim()) return;
      setIsAdding(true);
      await onAddJob(newJobUrl);
      setNewJobUrl('');
      setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full min-h-[750px]">
      
      {/* ADD JOB INPUT FIELD */}
      <div className="mb-8 mx-2 shrink-0">
          <form onSubmit={handleAddSubmit} className="relative max-w-2xl">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Link className="text-gray-400 group-focus-within:text-[#1a73e8] transition-colors" size={20} />
                    </div>
                    <input 
                        type="url" 
                        value={newJobUrl}
                        onChange={(e) => setNewJobUrl(e.target.value)}
                        placeholder="Paste a job link to add to board..."
                        className="w-full pl-12 pr-36 py-4 bg-white border border-[#DADCE0] rounded-full shadow-sm focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 outline-none text-[#202124] transition-all font-medium placeholder:text-gray-400"
                        disabled={isAdding}
                    />
                    <button 
                        type="submit"
                        disabled={isAdding || !newJobUrl.trim()}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-[#1a73e8] text-white rounded-full font-bold text-sm hover:bg-[#1557B0] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                    >
                        {isAdding ? (
                            <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                            Adding
                            </>
                        ) : (
                            <>
                            <Plus size={16} />
                            Add Job
                            </>
                        )}
                    </button>
                </div>
          </form>
      </div>

      {/* BOARD COLUMNS */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-6 items-stretch px-2 custom-scrollbar">
        {columns.map(col => {
            const colJobs = jobs.filter(j => j.status === col.id);
            return (
                <div 
                    key={col.id}
                    className={`flex flex-col h-full min-w-[340px] rounded-[32px] p-4 transition-colors ${col.bgClass} border border-[#DADCE0]`}
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
