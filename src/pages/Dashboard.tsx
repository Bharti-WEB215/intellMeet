// Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { GlassCard } from '../components/GlassCard.js';
import { 
  Calendar, Sparkles, AlertCircle, Clock, CheckCircle, 
  Activity, Smile, Play, TrendingUp 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../services/api.js';
import { motion } from 'framer-motion';

interface DashboardMetrics {
  meetingsToday: number;
  activeUsers: number;
  generatedTasks: number;
  completedTasks: number;
  aiInsightsGenerated: number;
  averageSentiment: number;
  taskCompletionRate: number;
  avgMeetingDuration: number;
}

const fallbackFocusData = [
  { time: '0m', focus: 65 },
  { time: '10m', focus: 78 },
  { time: '20m', focus: 85 },
  { time: '30m', focus: 92 },
  { time: '40m', focus: 89 },
  { time: '50m', focus: 84 },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }
};

export const Dashboard: React.FC = () => {
  const { setCurrentView, tasks, fetchTasks } = useStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<any | null>(null);
  const [focusLevel, setFocusLevel] = useState(88);
  const [focusData, setFocusData] = useState<any[]>(fallbackFocusData);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [mDetails, actList, mtgList, trendsResult] = await Promise.all([
          api.analytics.getDashboard().catch(() => null),
          api.workspace.getActivities().catch(() => []),
          api.meetings.list().catch(() => []),
          api.analytics.getTrends().catch(() => null)
        ]);
        
        const fallbackMDetails = {
          totalMeetings: 0,
          activeMeetings: 0,
          totalTasks: 0,
          completedTasks: 0,
          activeUsers: 1,
          taskCompletionRate: 0,
          aiInsightsGenerated: 0,
          avgMeetingDuration: 0,
          recentMeetings: [],
          averageSentiment: 85
        };

        const finalMetrics = mDetails || fallbackMDetails;
        setMetrics(finalMetrics);
        setActivities((actList || []).slice(-3).reverse());
        
        const safeMtgList = mtgList || [];
        const activeM = safeMtgList.find((m: any) => m.status === 'active');
        setActiveMeeting(activeM || (safeMtgList.length ? safeMtgList[0] : null));

        // Build focus chart data from trends if available
        if (trendsResult && Array.isArray(trendsResult) && trendsResult.length > 0) {
          const mapped = trendsResult.slice(-6).map((t: any, i: number) => ({
            time: t.label || t.period || `${i * 10}m`,
            focus: t.focus ?? t.engagement ?? t.score ?? 80
          }));
          setFocusData(mapped);
        }

        // Generate AI recommendation from real metrics
        const completionRate = finalMetrics.taskCompletionRate ?? 0;
        const sentiment = finalMetrics.averageSentiment ?? 0;
        const avgDuration = finalMetrics.avgMeetingDuration ?? 0;
        let rec = '';
        if (completionRate < 50) {
          rec = `Task completion rate is at ${completionRate}%. Consider breaking down large tasks into smaller, actionable items and scheduling focused sprint sessions to boost delivery velocity.`;
        } else if (sentiment < 60) {
          rec = `Team sentiment is at ${sentiment}%. We suggest scheduling a brief wellness check-in and limiting consecutive meetings to ${Math.min(avgDuration, 30)} minutes to improve morale.`;
        } else if (avgDuration > 45) {
          rec = `Average session duration is ${avgDuration}m which exceeds the recommended 45-minute limit. Consider implementing focus blocks and shorter stand-up formats to maintain engagement.`;
        } else {
          rec = `Team is performing well with ${completionRate}% task completion and ${sentiment}% positive sentiment. Maintain current cadence and consider celebrating recent wins to sustain momentum.`;
        }
        setAiRecommendation(rec);

        fetchTasks();
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    const interval = setInterval(() => {
      setFocusLevel(prev => {
        const delta = Math.floor(Math.random() * 5) - 2.5;
        return Math.min(100, Math.max(70, Number((prev + delta).toFixed(0))));
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchTasks]);

  const todoTasksCount = tasks.filter(t => t.status !== 'done').length;

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] text-[var(--theme-text-secondary)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider">LOADING COMMAND CENTER...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-8 w-full text-[var(--theme-text)]"
    >
      
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[var(--theme-text)] tracking-tight leading-none my-0">AI Command Center</h1>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-1.5 tracking-wide">Real-time collaboration monitoring & sentiment metrics</p>
        </div>
        
        {/* Quick Action Button */}
        <button 
          onClick={() => setCurrentView('meeting-room')}
          className="btn-magnetic flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white border border-white/10 hover:-translate-y-0.5 transition-all duration-300 text-xs font-bold cursor-pointer"
          style={{ boxShadow: 'var(--theme-glow-primary)' }}
        >
          <Play className="w-4 h-4 fill-white text-white" />
          <span>Launch Live Sync Room</span>
        </button>
      </div>
      
      {/* 10 Widgets in Bento Grid Layout */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[140px]"
      >
        
        {/* Widget 1: Meetings Today (col-span-2) */}
        <motion.div variants={staggerItem} className="col-span-1 md:col-span-2 row-span-1">
          <GlassCard hoverable className="h-full border-[var(--theme-border)] flex flex-col justify-between" onClick={() => setCurrentView('meeting-room')}>
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)]">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> Active Workspace Session</span>
              {activeMeeting?.status === 'active' && (
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE NOW</span>
              )}
            </div>
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="font-heading text-2xl font-black text-[var(--theme-text)] truncate max-w-[320px]">
                  {activeMeeting ? activeMeeting.title : 'Ready to Start Sync'}
                </p>
                <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                  {activeMeeting ? `Created on ${new Date(activeMeeting.created_at).toLocaleDateString()}` : 'Click to launch meeting workspace'}
                </p>
              </div>
              <button className="rounded-lg bg-[var(--theme-surface-alt)] border border-[var(--theme-border)] px-3 py-1.5 text-[10px] font-bold hover:bg-primary hover:text-white transition-all duration-200 cursor-pointer">
                {activeMeeting?.status === 'active' ? 'Join' : 'Enter'}
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Widget 2: AI Insights Ticker */}
        <motion.div variants={staggerItem} className="col-span-1">
          <GlassCard className="h-full border-[var(--theme-border)] flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)]">
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-accent" /> Insights Compiled</span>
              <span className="text-[9px] text-accent font-bold font-mono">Real-time</span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-black text-accent font-mono tracking-tight">{metrics.aiInsightsGenerated}</p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] mt-1">Transcripts converted to notes</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Widget 3: Pending Action Items */}
        <motion.div variants={staggerItem} className="col-span-1">
          <GlassCard hoverable className="h-full border-[var(--theme-border)] flex flex-col justify-between" onClick={() => setCurrentView('kanban')}>
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)]">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-secondary" /> Pending Goals</span>
              <span className="rounded bg-[var(--theme-surface-alt)] px-2 py-0.5 text-[9px] font-mono font-bold text-[var(--theme-text-muted)]">{todoTasksCount} left</span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-black text-[var(--theme-text)] font-mono">{todoTasksCount}</p>
              <p className="text-[10px] text-[var(--theme-text-muted)] mt-1">Assigned from live meetings</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Widget 4: Productivity Score (col-span-1, row-span-2) */}
        <motion.div variants={staggerItem} className="col-span-1 row-span-2">
          <GlassCard hoverable className="h-full border-[var(--theme-border)] flex flex-col justify-between" onClick={() => setCurrentView('analytics')}>
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)]">
              <span className="font-heading font-semibold">Overall Productivity</span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center my-4">
              {/* Circular Ring Progress */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="var(--theme-surface-alt)" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="url(#primaryGradient)" strokeWidth="8" fill="transparent"
                    strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * metrics.taskCompletionRate) / 100} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center">
                  <span className="text-3xl font-black font-mono text-[var(--theme-text)]">{metrics.taskCompletionRate}%</span>
                  <span className="block text-[8px] text-[var(--theme-text-secondary)] uppercase tracking-widest font-bold mt-0.5">Clarity</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-center text-[var(--theme-text-secondary)]">Based on task completion velocity</p>
          </GlassCard>
        </motion.div>

        {/* Widget 5: Team Health Score */}
        <motion.div variants={staggerItem} className="col-span-1">
          <GlassCard hoverable className="h-full border-[var(--theme-border)] flex flex-col justify-between" onClick={() => setCurrentView('team-mood')}>
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)]">
              <span className="flex items-center gap-1.5"><Smile className="w-4 h-4 text-accent" /> Emotional Energy</span>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">EXCELLENT</span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-black text-[var(--theme-text)] font-mono">{metrics.averageSentiment}%</p>
              <p className="text-[10px] text-[var(--theme-text-muted)] mt-1">Average meeting sentiment</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Widget 6: Upcoming Meetings */}
        <motion.div variants={staggerItem} className="col-span-1">
          <GlassCard className="h-full border-[var(--theme-border)] flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)]">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[var(--theme-text-secondary)]" /> Session Duration</span>
            </div>
            <div className="mt-2 text-left space-y-1">
              <p className="text-3xl font-black text-[var(--theme-text)] font-mono">{metrics.avgMeetingDuration}m</p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] font-mono">Average session slot</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Widget 7: Smart System Alerts */}
        <motion.div variants={staggerItem} className="col-span-1">
          <GlassCard className="h-full border-[var(--theme-border)] flex flex-col justify-between bg-yellow-500/5 border-yellow-500/20">
            <div className="flex justify-between items-center text-xs text-yellow-500">
              <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Active Workspace Users</span>
              <span className="text-[9px] bg-yellow-500/20 px-1.5 py-0.5 rounded text-yellow-400 font-bold">ONLINE</span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-black text-[var(--theme-text)] font-mono">{metrics.activeUsers}</p>
              <p className="text-[10px] text-[var(--theme-text-secondary)] mt-1">Members currently active</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Widget 8: Focus Meter (col-span-2, row-span-1) */}
        <motion.div variants={staggerItem} className="col-span-1 md:col-span-2 row-span-1">
          <GlassCard className="h-full border-[var(--theme-border)] flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)]">
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-secondary" /> Attention Concentration</span>
              <span className="text-xs font-bold font-mono text-secondary">{focusLevel}%</span>
            </div>
            <div className="flex-1 min-h-[50px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={focusData} margin={{ top: 2, right: 0, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFocus" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="var(--theme-chart-axis)" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--theme-chart-axis)" fontSize={8} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', fontSize: '10px', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="focus" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorFocus)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Widget 9: Recent Activity Timeline */}
        <motion.div variants={staggerItem} className="col-span-1">
          <GlassCard className="h-full border-[var(--theme-border)] flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)]">
              <span className="font-heading font-semibold">Recent Activity Logs</span>
            </div>
            <div className="mt-2 text-left space-y-1.5 overflow-hidden">
              {activities.length ? (
                activities.map((act) => (
                  <div key={act.id} className="text-[10px] text-[var(--theme-text-muted)] truncate">
                    <span className="text-secondary font-bold font-mono">[Sync]</span> {act.user_name} {act.action}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-[var(--theme-text-muted)] font-mono italic">No actions logged yet.</div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Widget 10: AI Recommendations */}
        <motion.div variants={staggerItem} className="col-span-1 md:col-span-2">
          <GlassCard className="h-full border-[var(--theme-border)] flex items-start gap-4">
            <div className="rounded-xl bg-primary/20 p-2.5 border border-primary/30 text-primary flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading text-xs font-bold text-[var(--theme-text)] tracking-wider uppercase">AI Insight Action Recommendation</h4>
              <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                {aiRecommendation || 'Analyzing workspace data to generate personalized recommendations...'}
              </p>
            </div>
          </GlassCard>
        </motion.div>

      </motion.div>
    </motion.div>
  );
};
export default Dashboard;
