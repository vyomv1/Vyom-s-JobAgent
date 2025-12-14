
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Job } from '../types';

interface StatsPanelProps {
  jobs: Job[];
  selectedIndustry: string | null;
  onSelectIndustry: (industry: string | null) => void;
}

// Google Brand Colors
const COLORS = [
  '#4285F4', // Blue
  '#DB4437', // Red
  '#F4B400', // Yellow
  '#0F9D58', // Green
  '#AB47BC', // Purple
  '#00ACC1'  // Cyan
];

const StatsPanel: React.FC<StatsPanelProps> = ({ jobs, selectedIndustry, onSelectIndustry }) => {
  const getIndustry = (job: Job): string => {
    if (job.analysis?.industry && job.analysis.industry !== "Other") {
        return job.analysis.industry;
    }
    const text = (job.company + " " + job.title + " " + (job.summary || "")).toLowerCase();
    if (text.match(/bank|finance|wealth|fintech/)) return 'Fintech';
    if (text.match(/insurance|underwrit/)) return 'Insurance';
    if (text.match(/gov|public|council|nhs/)) return 'Public Sector';
    if (text.match(/agency|studio/)) return 'Agency';
    return 'Tech';
  };

  const industryCounts = jobs.reduce((acc, job) => {
    if ((job.status || 'new') !== 'new') return acc;
    const industry = getIndustry(job);
    acc[industry] = (acc[industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(industryCounts)
    .map(([name, value]) => ({ name, value: value as number }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalJobs = data.reduce((sum, item) => sum + item.value, 0);

  if (totalJobs === 0) return null;

  return (
    <div className="bg-[#F1F3F4] rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-[#70757A] uppercase tracking-wide">Market Breakdown</h3>
        {selectedIndustry && (
            <button 
                onClick={() => onSelectIndustry(null)}
                className="text-[10px] font-bold text-[#1a73e8] hover:bg-white px-2 py-1 rounded-md transition-colors"
                aria-label="Clear Industry Filter"
            >
                CLEAR
            </button>
        )}
      </div>
      
      <div className="h-[180px] relative mb-6 cursor-pointer" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
                data={data} 
                cx="50%" 
                cy="50%" 
                innerRadius={50} 
                outerRadius={70} 
                paddingAngle={4} 
                dataKey="value" 
                stroke="none" 
                cornerRadius={4}
                onClick={(data) => {
                    const newSelection = selectedIndustry === data.name ? null : data.name;
                    onSelectIndustry(newSelection);
                }}
            >
              {data.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    opacity={selectedIndustry && selectedIndustry !== entry.name ? 0.3 : 1}
                    className="transition-all duration-300 outline-none"
                    style={{ outline: 'none' }}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-3xl font-bold text-[#202124]">{selectedIndustry ? data.find(d => d.name === selectedIndustry)?.value : totalJobs}</span>
             <span className="text-[10px] uppercase font-bold text-[#5F6368]">{selectedIndustry ? 'Jobs' : 'Total'}</span>
        </div>
      </div>
      
      <div className="space-y-2" role="list">
        {data.map((entry, index) => {
          const isSelected = selectedIndustry === entry.name;
          return (
            <button
                key={entry.name} 
                role="listitem"
                onClick={() => onSelectIndustry(isSelected ? null : entry.name)}
                className={`w-full flex items-center justify-between text-xs cursor-pointer p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a73e8] ${isSelected ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                aria-pressed={isSelected}
            >
               <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} aria-hidden="true"></div>
                 <span className={`font-semibold ${isSelected ? 'text-[#202124]' : 'text-[#5F6368]'}`}>{entry.name}</span>
               </div>
               <span className="font-bold text-[#202124]">{entry.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StatsPanel;
