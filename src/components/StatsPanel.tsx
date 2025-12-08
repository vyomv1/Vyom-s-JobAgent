
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Job } from '../types';

interface StatsPanelProps {
  jobs: Job[];
}

const COLORS = ['#0B57D0', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']; 

const StatsPanel: React.FC<StatsPanelProps> = ({ jobs }) => {
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
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wide">Market Breakdown</h3>
      
      <div className="h-[160px] relative mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} fill="#8884d8" paddingAngle={4} dataKey="value" stroke="none" cornerRadius={6}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-3">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between text-xs">
             <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
               <span className="font-semibold text-slate-600">{entry.name}</span>
             </div>
             <span className="font-bold text-slate-900 bg-gray-100 px-2 py-0.5 rounded-md">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;
