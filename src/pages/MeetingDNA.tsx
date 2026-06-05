// MeetingDNA.tsx
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { GlassCard } from '../components/GlassCard.js';
import { 
  Sparkles, Award, Users, BarChart2, 
  RefreshCw, Zap, Target 
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Tooltip 
} from 'recharts';
import { api } from '../services/api.js';

export const MeetingDNA: React.FC = () => {
  const { activeMeetingId } = useStore();
  const [dna, setDna] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDnaData = async () => {
    setLoading(true);
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
      const dnaResult = await api.analytics.getDNA(targetMtgId);
      setDna(dnaResult);
    } catch (err) {
      console.error('Failed to load meeting DNA:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDnaData();
  }, [activeMeetingId]);

  if (loading || !dna) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] text-[var(--theme-text-secondary)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider">RETRIEVING MEETING DNA bluePRINT...</span>
        </div>
      </div>
    );
  }

  // Format Recharts radar data using database scores
  const radarData = [
    { subject: 'Collaboration', score: dna.collaboration_percent, average: 75 },
    { subject: 'Participation', score: dna.participation_balance, average: 80 },
    { subject: 'Actionability', score: dna.actionability, average: 70 },
    { subject: 'Focus', score: dna.focus_score, average: 82 },
    { subject: 'Team Mood', score: dna.positive_percent, average: 78 },
    { subject: 'Energy', score: dna.energy_score, average: 80 },
    { subject: 'Decision Quality', score: dna.decision_quality, average: 72 },
  ];

  return (
    <div className="space-y-6 w-full text-[var(--theme-text)] animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--theme-text)] tracking-tight leading-none my-0 flex items-center gap-2">
            Meeting DNA 
            <span className="text-xs bg-accent/20 border border-accent/30 text-accent font-mono px-2 py-0.5 rounded-full">SIGNATURE MATRIX</span>
          </h1>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Multi-axis blueprint analyzing the cognitive and structural value of the latest session</p>
        </div>
        <button 
          onClick={fetchDnaData}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--theme-border)] rounded-xl bg-[var(--theme-surface-alt)] hover:bg-[var(--theme-surface-hover)] transition-colors text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-Analyze DNA
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Module 1: Radar Chart (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <GlassCard className="border-[var(--theme-border)] flex flex-col justify-between min-h-[420px]">
            <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)] mb-4">
              <span className="flex items-center gap-1.5"><BarChart2 className="w-4 h-4 text-primary" /> Multi-Axis Blueprint</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary" /> Session Score</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-650" /> Org Average</span>
              </div>
            </div>
            
            <div className="flex-1 min-h-[350px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="var(--theme-border)" />
                  <PolarAngleAxis dataKey="subject" stroke="var(--theme-text-secondary)" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--theme-chart-axis)" fontSize={9} />
                  <Radar name="Current Session" dataKey="score" stroke="#6D5DFC" fill="#6D5DFC" fillOpacity={0.25} />
                  <Radar name="Org Average" dataKey="average" stroke="#94A3B8" fill="transparent" strokeDasharray="3 3" />
                  <Tooltip contentStyle={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', fontSize: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Module 2: Progress Rings & Highlights (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="border-[var(--theme-border)] space-y-4">
            <h3 className="text-sm font-bold text-slate-355 flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" /> Highlight Indicators
            </h3>

            <div className="space-y-4">
              {/* Decision Quality */}
              <div className="flex items-center justify-between border-b border-[var(--theme-divider)] pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-accent/15 border border-accent/25 p-2 text-accent">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--theme-text)]">Decision Quality</h4>
                    <p className="text-[9px] text-[var(--theme-text-muted)]">Decisive outcomes cataloged</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[var(--theme-text)] font-mono">{dna.decision_quality}%</span>
                  <span className="block text-[8px] text-accent font-bold">
                    {dna.decision_quality > 75 ? 'HIGH' : 'STABLE'}
                  </span>
                </div>
              </div>

              {/* Participation balance */}
              <div className="flex items-center justify-between border-b border-[var(--theme-divider)] pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/15 border border-primary/25 p-2 text-primary">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--theme-text)]">Participation Balance</h4>
                    <p className="text-[9px] text-[var(--theme-text-muted)]">Speech split evenly among members</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[var(--theme-text)] font-mono">{dna.participation_balance}%</span>
                  <span className="block text-[8px] text-primary font-bold">
                    {dna.participation_balance > 80 ? 'BALANCED' : 'IMBALANCED'}
                  </span>
                </div>
              </div>

              {/* Energy Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-secondary/15 border border-secondary/25 p-2 text-secondary">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--theme-text)]">Team Energy Score</h4>
                    <p className="text-[9px] text-[var(--theme-text-muted)]">Motivated linguistic markers detected</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[var(--theme-text)] font-mono">{dna.energy_score}%</span>
                  <span className="block text-[8px] text-secondary font-bold">
                    {dna.energy_score > 80 ? 'OPTIMAL' : 'MODERATE'}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border-[var(--theme-border)] space-y-3">
            <h3 className="text-sm font-bold text-slate-355 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> AI Signature Feedback
            </h3>
            <p className="text-xs text-slate-355 leading-relaxed">
              This session ranks in the top tier for focus ({dna.focus_score}%) and decision making efficiency ({dna.decision_quality}%). Strong collaboration marks and minimal distraction offsets prove that framing agendas beforehand dramatically increases productivity outcomes.
            </p>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};
export default MeetingDNA;
