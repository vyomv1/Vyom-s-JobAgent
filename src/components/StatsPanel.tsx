
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Job } from '../types';

interface StatsPanelProps {
  jobs: Job[]; 
  selectedIndustry: string | null;
  onSelectIndustry: (industry: string | null) => void;
}

// Apple Data Colors
const COLORS = [
  '#0071e3', // Blue
  '#ff2d55', // Pink
  '#ffcc00', // Yellow
  '#34c759', // Green
  '#af52de', // Purple
  '#5856d6'  // Indigo
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Breakdown</h3>
        {selectedIndustry && (
            <button 
                onClick={() => onSelectIndustry(null)}
                className="text-[10px] font-bold text-[#0071e3] hover:underline"
            >
                Reset
            </button>
        )}
      </div>
      
      {/* Reduced Height for Compact View */}
      <div className="h-[120px] relative mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
                data={data} 
                cx="50%" 
                cy="50%" 
                innerRadius={35} 
                outerRadius={55} 
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
                    style={{ outline: 'none', transition: 'all 0.3s ease', cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', padding: '8px 12px', fontSize: '11px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', background: '#fff' }}
              itemStyle={{ color: '#1d1d1f', fontWeight: 600 }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-2xl font-bold text-[#1d1d1f] tracking-tight">{selectedIndustry ? data.find(d => d.name === selectedIndustry)?.value : totalJobs}</span>
        </div>
      </div>
      
      <div className="space-y-1">
        {data.slice(0, 5).map((entry, index) => {
          const isSelected = selectedIndustry === entry.name;
          return (
            <button
                key={entry.name} 
                onClick={() => onSelectIndustry(isSelected ? null : entry.name)}
                className={`w-full flex items-center justify-between text-[11px] cursor-pointer px-2.5 py-1.5 rounded-lg transition-colors ${isSelected ? 'bg-[#F5F5F7] font-semibold text-[#0071e3]' : 'text-[#86868b] hover:bg-[#F5F5F7]'}`}
            >
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                 <span className="truncate max-w-[140px]">{entry.name}</span>
               </div>
               <span>{entry.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StatsPanel;
