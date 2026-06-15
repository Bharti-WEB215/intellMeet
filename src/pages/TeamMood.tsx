// TeamMood.tsx
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { GlassCard } from '../components/GlassCard.js';
import { 
  Smile, TrendingUp, AlertTriangle, 
  BrainCircuit, Users, Zap 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar 
} from 'recharts';
import { api } from '../services/api.js';

const defaultDepartmentData = [
  { name: 'Dev', energy: 88, focus: 82, stress: 30 },
  { name: 'Design', energy: 90, focus: 85, stress: 45 },
  { name: 'Marketing', energy: 82, focus: 75, stress: 25 },
  { name: 'Management', energy: 86, focus: 88, stress: 35 },
];

export const TeamMood: React.FC = () => {
  const { activeMeetingId } = useStore();
  const [dna, setDna] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoodData = async () => {
      // Use active meeting or default to first completed meeting
      let targetMtgId: string = activeMeetingId || '';
      if (!targetMtgId) {
        try {
          const list = await api.meetings.list();
          const completed = list.find((m: any) => m.status === 'completed');
          targetMtgId = completed ? completed.id : (list[0]?.id || 'mtg-default');
        } catch (err) {
          targetMtgId = 'mtg-default';
        }
      }

      try {
        const [dnaResult, timelineResult] = await Promise.all([
          api.analytics.getDNA(targetMtgId),
          api.analytics.getSentiment(targetMtgId)
        ]);
        setDna(dnaResult);
        setTimeline(timelineResult);
      } catch (err) {
        console.error('Failed to load mood analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMoodData();
  }, [activeMeetingId]);

  if (loading || !dna) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] text-[var(--theme-text-secondary)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider">HARVESTING EMOTIONAL SPECTRIC INDEX...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full text-[var(--theme-text)] animate-fadeIn">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--theme-text)] tracking-tight leading-none my-0 flex items-center gap-2">
          Team Mood Analysis 
          <span className="text-xs bg-primary/20 border border-primary/30 text-primary font-mono px-2 py-0.5 rounded-full">FLAGSHIP CORE</span>
        </h1>
        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">AI voice pitch & linguistic sentiment analysis from live meeting interactions</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Module 1: Mood Meter (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="border-[var(--theme-border)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] flex items-center gap-2">
              <Smile className="w-4 h-4 text-accent" /> Emotional Spectrum
            </h3>
            
            <div className="space-y-3">
              {/* Happy */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--theme-text)]">Motivated & Happy</span>
                  <span className="font-mono text-accent">{dna.positive_percent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--theme-surface-alt)] overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${dna.positive_percent}%` }} />
                </div>
              </div>

              {/* Neutral */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--theme-text)]">Focused & Neutral</span>
                  <span className="font-mono text-[var(--theme-text-secondary)] font-semibold">{dna.neutral_percent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--theme-surface-alt)] overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${dna.neutral_percent}%` }} />
                </div>
              </div>

              {/* Stressed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--theme-text)]">Stress Warnings</span>
                  <span className="font-mono text-yellow-400 font-semibold">{dna.stress_percent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--theme-surface-alt)] overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${dna.stress_percent}%` }} />
                </div>
              </div>

              {/* Frustrated */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--theme-text)]">Frustrated Indicators</span>
                  <span className="font-mono text-red-400 font-semibold">{dna.negative_percent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--theme-surface-alt)] overflow-hidden">
                  <div className="h-full bg-red-400" style={{ width: `${dna.negative_percent}%` }} />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Energy Scores Card */}
          <GlassCard className="border-[var(--theme-border)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-secondary" /> Energy Index Scorecard
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--theme-input-bg)] border border-[var(--theme-divider)] p-3 rounded-xl">
                <span className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-bold">Engagement</span>
                <p className="text-2xl font-black text-[var(--theme-text)] font-mono mt-1">{dna.engagement_percent}%</p>
              </div>
              <div className="bg-[var(--theme-input-bg)] border border-[var(--theme-divider)] p-3 rounded-xl">
                <span className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-bold">Focus Rate</span>
                <p className="text-2xl font-black text-[var(--theme-text)] font-mono mt-1">{dna.focus_score}%</p>
              </div>
              <div className="bg-[var(--theme-input-bg)] border border-[var(--theme-divider)] p-3 rounded-xl">
                <span className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-bold">Collaboration</span>
                <p className="text-2xl font-black text-[var(--theme-text)] font-mono mt-1">{dna.collaboration_percent}%</p>
              </div>
              <div className="bg-[var(--theme-input-bg)] border border-[var(--theme-divider)] p-3 rounded-xl">
                <span className="text-[10px] text-[var(--theme-text-muted)] uppercase tracking-wider font-bold">Resilience</span>
                <p className="text-2xl font-black text-[var(--theme-text)] font-mono mt-1">{100 - dna.stress_percent}%</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Module 2: Timeline Graph (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <GlassCard className="border-[var(--theme-border)] flex flex-col justify-between min-h-[300px]">
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)] mb-4">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" /> Sentiment Timeline Progression</span>
              <span className="text-[9px] text-primary font-bold">SYNC ROOM STATS</span>
            </div>
            
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="motivatedGrad" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="5%" stopColor="#6D5DFC" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6D5DFC" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="stressedGrad" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="var(--theme-chart-axis)" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--theme-chart-axis)" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="Positive" stroke="#6D5DFC" strokeWidth={2} fillOpacity={1} fill="url(#motivatedGrad)" name="Positive" />
                  <Area type="monotone" dataKey="Stress" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#stressedGrad)" name="Stress Level" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Burnout Detection & Department Comparison (col-span-12) */}
        <div className="lg:col-span-6 space-y-6">
          <GlassCard className="border-[var(--theme-border)] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Burnout Risk Warning Desk
              </h3>
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">1 ALARM</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--theme-divider)] pb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-[var(--theme-text)]">Creative Department fatigue</h4>
                  <p className="text-[10px] text-[var(--theme-text-muted)]">Exceeded 4 continuous video sync hours</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-red-400 font-bold font-mono">HIGH RISK</span>
                  <span className="block text-[10px] text-[var(--theme-text-muted)] font-mono">82% stress</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[var(--theme-text)]">Engineering Dev sprint blocks</h4>
                  <p className="text-[10px] text-[var(--theme-text-muted)]">Focus intervals are stable</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-400 font-bold font-mono">STABLE</span>
                  <span className="block text-[10px] text-[var(--theme-text-muted)] font-mono">22% stress</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <GlassCard className="border-[var(--theme-border)] flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)] mb-3">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-[var(--theme-text-secondary)]" /> Department Breakdown Comparisons</span>
            </div>
            
            <div className="flex-1 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defaultDepartmentData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="var(--theme-chart-axis)" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--theme-chart-axis)" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', fontSize: '10px' }} />
                  <Bar dataKey="energy" fill="#6D5DFC" radius={[4, 4, 0, 0]} name="Energy" />
                  <Bar dataKey="stress" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Stress" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* AI Recommendations (col-span-12) */}
        <GlassCard className="lg:col-span-12 border-[var(--theme-border)] flex items-start gap-4">
          <div className="rounded-xl bg-primary/20 p-2.5 border border-primary/30 text-primary flex-shrink-0">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-[var(--theme-text)] font-mono tracking-wider">AI DIAGNOSTIC RECOMMENDATIONS</h4>
            <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
              Linguistic evaluation indicates a 15% increase in stressful phrasing ("backlog", "deadlines", "delay") in the design channel. Recommend scheduling a <strong>"Quiet Block Thursday"</strong> and limiting consecutive meetings to 30 minutes to reduce burnout fatigue.
            </p>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};
export default TeamMood;
