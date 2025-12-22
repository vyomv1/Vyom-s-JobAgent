import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Job } from '../types';
import { Activity, Building2, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

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
  '#5856d6', // Indigo
  '#8e8e93', // Gray
  '#ff9500', // Orange
];

type ViewMode = 'industry' | 'seniority' | 'status';

const StatsPanel: React.FC<StatsPanelProps> = ({ jobs, selectedIndustry, onSelectIndustry }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('industry');

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

  const chartData = useMemo(() => {
    let counts: Record<string, number> = {};

    if (viewMode === 'industry') {
        counts = jobs.reduce((acc, job) => {
            const ind = getIndustry(job);
            acc[ind] = (acc[ind] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    } else if (viewMode === 'seniority') {
        counts = jobs.reduce((acc, job) => {
            const level = job.seniorityScore || 'Unspecified';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    } else if (viewMode === 'status') {
        counts = jobs.reduce((acc, job) => {
            const status = job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'New';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [jobs, viewMode]);

  const totalItems = chartData.reduce((sum, item) => sum + item.value, 0);

  const handleSliceClick = (entry: any) => {
      if (viewMode === 'industry') {
          const newSelection = selectedIndustry === entry.name ? null : entry.name;
          onSelectIndustry(newSelection);
      }
  };

  if (totalItems === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-0 border border-black/5 dark:border-white/10 shadow-lg shadow-black/5 flex flex-col h-full relative overflow-hidden group transition-all duration-300">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header & Tabs */}
      <div className="px-5 pt-4 pb-2 z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[#0071e3]">
                    <Activity size={14} />
                </div>
                <h3 className="text-[11px] font-bold text-[#86868b] dark:text-[#98989D] uppercase tracking-wider">Market Radar</h3>
            </div>
            {selectedIndustry && viewMode === 'industry' && (
                <button 
                    onClick={() => onSelectIndustry(null)}
                    className="text-[10px] font-bold text-white bg-[#0071e3] px-2 py-1 rounded-md transition-colors hover:bg-[#0077ED] shadow-sm"
                >
                    Clear Filter
                </button>
            )}
          </div>

          <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
             <button onClick={() => setViewMode('industry')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'industry' ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>
                <Building2 size={12}/> Market
             </button>
             <button onClick={() => setViewMode('seniority')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'seniority' ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>
                <TrendingUp size={12}/> Level
             </button>
             <button onClick={() => setViewMode('status')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'status' ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>
                <PieChartIcon size={12}/> Status
             </button>
          </div>
      </div>
      
      {/* Content Area */}
      <div className="flex items-center gap-2 flex-1 min-h-0 px-5 pb-2">
          {/* Chart */}
          <div className="h-[120px] w-[120px] relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                    data={chartData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={35} 
                    outerRadius={55} 
                    paddingAngle={4} 
                    dataKey="value" 
                    stroke="none" 
                    cornerRadius={5}
                    onClick={handleSliceClick}
                    cursor={viewMode === 'industry' ? 'pointer' : 'default'}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={viewMode === 'industry' && selectedIndustry && selectedIndustry !== entry.name ? 0.2 : 1}
                        strokeWidth={0}
                        style={{ transition: 'all 0.3s ease' }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', padding: '8px 12px', fontSize: '11px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: '#fff' }}
                  itemStyle={{ color: '#1d1d1f', fontWeight: 600 }}
                  separator=""
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-2xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] leading-none tracking-tight">{viewMode === 'industry' && selectedIndustry ? chartData.find(d => d.name === selectedIndustry)?.value : totalItems}</span>
            </div>
          </div>
          
          {/* Legend - Grid Layout with Scrolling */}
          <div className="flex-1 overflow-y-auto h-full max-h-[140px] custom-scrollbar pl-2 py-1">
             <div className="flex flex-col gap-1.5">
                {chartData.map((entry, index) => {
                    const isSelected = viewMode === 'industry' && selectedIndustry === entry.name;
                    return (
                        <button
                            key={entry.name} 
                            onClick={() => handleSliceClick(entry)}
                            disabled={viewMode !== 'industry'}
                            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all w-full group ${isSelected ? 'bg-gray-100 dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/10' : viewMode === 'industry' ? 'hover:bg-gray-50 dark:hover:bg-white/5' : ''}`}
                        >
                            <div className="w-2 h-2 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <div className="flex items-center justify-between flex-1 min-w-0">
                                <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-black dark:text-white' : 'text-[#86868b] dark:text-gray-400'}`}>{entry.name}</span>
                                <span className="text-[10px] text-gray-400 font-medium tabular-nums opacity-60 group-hover:opacity-100">{Math.round((entry.value / totalItems) * 100)}%</span>
                            </div>
                        </button>
                    );
                })}
             </div>
          </div>
      </div>
    </div>
  );
};

export default StatsPanel;