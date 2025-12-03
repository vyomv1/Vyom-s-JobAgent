import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Job } from '../types';

interface StatsPanelProps {
  jobs: Job[];
}

// Deloitte-ish palette: Green, Black, Light Gray
const COLORS = ['#86BC25', '#000000', '#d1d5db']; 

const StatsPanel: React.FC<StatsPanelProps> = ({ jobs }) => {
  const analyzedJobs = jobs.filter(j => j.analysis);
  
  const highValue = analyzedJobs.filter(j => j.analysis?.isHighValue).length;
  const standard = analyzedJobs.filter(j => j.analysis && !j.analysis.isHighValue && j.analysis.score > 40).length;
  const rejected = analyzedJobs.filter(j => j.analysis && j.analysis.score <= 40).length;

  const data = [
    { name: 'High Priority', value: highValue },
    { name: 'Standard Fit', value: standard },
    { name: 'Low Relevance', value: rejected },
  ];

  if (analyzedJobs.length === 0) return null;

  return (
    <div className="bg-white rounded-sm p-6 border border-gray-200 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">Pipeline Health</h3>
      
      <div className="flex-1 min-h-[180px] relative mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '0px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '11px', fontWeight: 700, color: '#000', textTransform: 'uppercase' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
             <span className="text-3xl font-bold text-black block leading-none">{analyzedJobs.length}</span>
             <span className="text-[10px] text-gray-400 uppercase tracking-widest">Analyzed</span>
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-2 text-gray-600 font-medium uppercase tracking-wide">
            <span className="w-3 h-3 bg-[#86BC25]"></span>
            Tier 1 (Fintech)
          </span>
          <span className="font-bold text-black">{highValue}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-2 text-gray-600 font-medium uppercase tracking-wide">
            <span className="w-3 h-3 bg-black"></span>
            Tier 2 (General)
          </span>
          <span className="font-bold text-black">{standard}</span>
        </div>
         <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-2 text-gray-600 font-medium uppercase tracking-wide">
            <span className="w-3 h-3 bg-gray-300"></span>
            Tier 3 (Other)
          </span>
          <span className="font-bold text-black">{rejected}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;