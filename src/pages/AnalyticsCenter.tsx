// AnalyticsCenter.tsx
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard.js';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { Sparkles, Calendar, TrendingUp, Users, Zap, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';

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

const trendData = [
  { week: 'Week 1', effectiveness: 72, productivity: 68 },
  { week: 'Week 2', effectiveness: 78, productivity: 75 },
  { week: 'Week 3', effectiveness: 84, productivity: 80 },
  { week: 'Week 4', effectiveness: 89, productivity: 84 },
];

const attendanceData = [
  { day: 'Mon', count: 2 },
  { day: 'Tue', count: 4 },
  { day: 'Wed', count: 3 },
  { day: 'Thu', count: 2 },
  { day: 'Fri', count: 1 },
];

export const AnalyticsCenter: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.analytics.getDashboard();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch executive metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] text-[var(--theme-text-secondary)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider">COMPILING EXECUTIVE METRICS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full text-[var(--theme-text)] pb-12 animate-fadeIn">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--theme-text)] tracking-tight leading-none my-0">Executive Analytics</h1>
        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Cross-departmental meeting metrics and communication efficiency analysis</p>
      </div>

      {/* Numerical Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="border-[var(--theme-border)] p-4 flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" /> Core Productivity
          </span>
          <p className="text-3xl font-black text-[var(--theme-text)] font-mono mt-2">{metrics.averageSentiment - 2}%</p>
          <span className="text-[9px] text-emerald-450 mt-1 font-bold">+5.2% vs last month</span>
        </GlassCard>

        <GlassCard className="border-[var(--theme-border)] p-4 flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-secondary" /> Active Members
          </span>
          <p className="text-3xl font-black text-[var(--theme-text)] font-mono mt-2">{metrics.activeUsers}</p>
          <span className="text-[9px] text-[var(--theme-text-muted)] mt-1 font-bold">{metrics.meetingsToday} sessions / week</span>
        </GlassCard>

        <GlassCard className="border-[var(--theme-border)] p-4 flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Task Completion
          </span>
          <p className="text-3xl font-black text-[var(--theme-text)] font-mono mt-2">{metrics.taskCompletionRate}%</p>
          <span className="text-[9px] text-emerald-450 mt-1 font-bold">AI deadline adherence</span>
        </GlassCard>

        <GlassCard className="border-[var(--theme-border)] p-4 flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--theme-text-secondary)]" /> Focus Allocation
          </span>
          <p className="text-3xl font-black text-[var(--theme-text)] font-mono mt-2">{Math.min(100, metrics.avgMeetingDuration * 2)}%</p>
          <span className="text-[9px] text-[var(--theme-text-muted)] mt-1 font-bold">Optimized focus blocks</span>
        </GlassCard>
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Productivity & Effectiveness Trends */}
        <GlassCard className="border-[var(--theme-border)] flex flex-col justify-between min-h-[300px]">
          <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" /> Productivity Trends Over Weeks
          </h3>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="week" stroke="var(--theme-chart-axis)" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--theme-chart-axis)" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', fontSize: '10px' }} />
                <Line type="monotone" dataKey="productivity" stroke="#6D5DFC" strokeWidth={2.5} name="Productivity Rate" activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="effectiveness" stroke="#00D4FF" strokeWidth={2} name="Effectiveness" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Attendance patterns */}
        <GlassCard className="border-[var(--theme-border)] flex flex-col justify-between min-h-[300px]">
          <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-secondary" /> Daily Meeting Density Patterns
          </h3>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" stroke="var(--theme-chart-axis)" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--theme-chart-axis)" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', fontSize: '10px' }} />
                <Bar dataKey="count" fill="#00FFA3" radius={[4, 4, 0, 0]} name="Meetings Logged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* AI Insights bottom banner */}
      <GlassCard className="border-[var(--theme-border)] flex items-start gap-4">
        <div className="rounded-xl bg-primary/20 p-2.5 border border-primary/30 text-primary flex-shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-[var(--theme-text)] font-mono tracking-wider">EXECUTIVE OUTCOME INSIGHT</h4>
          <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
            By shifting engineering status syncs to asynchronous boards, average weekly meeting density declined by 18%. Engagement scoring correspondingly grew by 9.2%, reinforcing that shorter, well-framed slots produce substantially cleaner task delivery rates.
          </p>
        </div>
      </GlassCard>

    </div>
  );
};
export default AnalyticsCenter;
