import React from 'react';
import { Job } from '../types';
import { Calendar, Clock, MapPin, Video, ExternalLink, CalendarCheck, History, Phone } from 'lucide-react';

interface AppointmentsViewProps {
  jobs: Job[];
  onOpenDetail: (job: Job) => void;
}

const AppointmentsView: React.FC<AppointmentsViewProps> = ({ jobs, onOpenDetail }) => {
  const allScheduled = jobs.filter(j => j.interviewDate);

  // Split into Upcoming and Past
  const now = Date.now();
  const upcoming = allScheduled
    .filter(j => (j.interviewDate || 0) >= now)
    .sort((a, b) => (a.interviewDate || 0) - (b.interviewDate || 0));

  const past = allScheduled
    .filter(j => (j.interviewDate || 0) < now)
    .sort((a, b) => (b.interviewDate || 0) - (a.interviewDate || 0)); // Newest past first

  if (allScheduled.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full pt-32 pb-20 px-6 text-center overflow-y-auto custom-scrollbar">
              <div className="w-20 h-20 bg-gray-100 dark:bg-[#1C1C1E] rounded-full flex items-center justify-center mb-6 text-gray-300 dark:text-gray-600">
                  <Calendar size={32} />
              </div>
              <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-2">No Interviews Scheduled</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  Add an interview date to a job card in your pipeline to see it appear here on your timeline.
              </p>
          </div>
      );
  }

  const getGoogleCalendarUrl = (job: Job) => {
    if (!job.interviewDate) return '';
    const start = new Date(job.interviewDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000); 
    const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`Interview: ${job.title} at ${job.company}`);
    const details = encodeURIComponent(`Role: ${job.title}\nCompany: ${job.company}\nFormat: ${job.interviewFormat || 'Not specified'}\n\nStage Notes:\n${job.stageNotes || ''}`);
    const location = encodeURIComponent(job.location);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${format(start)}/${format(end)}`;
  };

  const AppointmentCard = ({ job, isPast, key }: { job: Job, isPast: boolean, key?: string }) => {
    const date = new Date(job.interviewDate!);
    const isToday = new Date().toDateString() === date.toDateString();
    
    // Logic for format icon
    const isPhone = job.interviewFormat === 'phone';
    const isVideo = job.interviewFormat === 'video' || (!job.interviewFormat && job.location.toLowerCase().includes('remote'));

    return (
        <div key={key || job.id} className="relative pl-12 group">
            {/* Timeline Dot */}
            <div className={`absolute left-0 top-1.5 w-10 h-10 rounded-full border-4 border-[#F5F5F7] dark:border-black flex items-center justify-center z-10 shadow-sm ${isToday ? 'bg-apple-blue text-white' : isPast ? 'bg-gray-100 dark:bg-white/10 text-gray-400' : 'bg-white dark:bg-[#2C2C2E] text-apple-blue'}`}>
                {isPast ? <History size={16} /> : <Calendar size={16} />}
            </div>

            <div 
                onClick={() => onOpenDetail(job)}
                className={`bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer ${isToday ? 'ring-1 ring-apple-blue' : ''} ${isPast ? 'opacity-70 grayscale-[0.5]' : ''}`}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isToday ? 'text-apple-blue' : isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                            {date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                        <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-white leading-tight mb-1">{job.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <span>{job.company}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><MapPin size={12}/> {job.location}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-black/20 p-3 rounded-xl self-start">
                        <div className="text-center px-2">
                            <div className="text-xs text-gray-400 font-bold uppercase">Time</div>
                            <div className="text-lg font-bold text-[#1d1d1f] dark:text-white">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-white/10"></div>
                        <div className="text-center px-2">
                            <div className="text-xs text-gray-400 font-bold uppercase">Format</div>
                            <div className="text-lg font-bold text-[#1d1d1f] dark:text-white flex items-center justify-center gap-1">
                                {isPhone ? <Phone size={16}/> : <Video size={16}/>}
                            </div>
                        </div>
                    </div>
                </div>

                {job.stageNotes && (
                    <div className="mb-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Session Prep</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{job.stageNotes}</p>
                    </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                    {!isPast && (
                        <a 
                            href={getGoogleCalendarUrl(job)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-xs font-bold text-[#1d1d1f] dark:text-white transition-colors"
                        >
                            <CalendarCheck size={14} /> Add to Calendar
                        </a>
                    )}
                    <div className="ml-auto">
                        <span className="text-xs font-bold text-apple-blue flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            {isPast ? 'Review Notes' : 'View Strategy'} <ExternalLink size={12} />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
      <div className="max-w-4xl mx-auto px-6 py-10">
          
          {/* Upcoming Section */}
          {upcoming.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-10">
                  <h1 className="text-3xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">Upcoming</h1>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-white/10"></div>
              </div>
              <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-200 dark:before:bg-white/10">
                  {upcoming.map(job => <AppointmentCard key={job.id} job={job} isPast={false} />)}
              </div>
            </div>
          )}

          {/* Past Section */}
          {past.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-10">
                  <h2 className="text-2xl font-bold text-gray-400 dark:text-gray-500 tracking-tight">History</h2>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-white/10"></div>
              </div>
              <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100 dark:before:bg-white/5">
                  {past.map(job => <AppointmentCard key={job.id} job={job} isPast={true} />)}
              </div>
            </div>
          )}
          
      </div>
    </div>
  );
};

export default AppointmentsView;