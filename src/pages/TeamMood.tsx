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

const fallbackDepartmentData = [
  { name: 'Dev', energy: 88, focus: 82, stress: 30 },
  { name: 'Design', energy: 90, focus: 85, stress: 45 },
  { name: 'Marketing', energy: 82, focus: 75, stress: 25 },
  { name: 'Management', energy: 86, focus: 88, stress: 35 },
];

export const TeamMood: React.FC = () => {
  const { activeMeetingId } = useStore();
  const [dna, setDna] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>(fallbackDepartmentData);
  const [burnoutWarnings, setBurnoutWarnings] = useState<any[]>([]);
  const [aiDiagnostic, setAiDiagnostic] = useState('');
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
        const [dnaResult, timelineResult, trendsResult] = await Promise.all([
          api.analytics.getDNA(targetMtgId).catch(() => null),
          api.analytics.getSentiment(targetMtgId).catch(() => null),
          api.analytics.getTrends().catch(() => null)
        ]);

        const fallbackDna = {
          energyLevel: 80,
          clarityScore: 85,
          overallSentiment: 75,
          engagement: 90
        };

        const fallbackTimeline = [
          { time: '0m', score: 60, speakers: 1 },
          { time: '10m', score: 75, speakers: 2 },
          { time: '20m', score: 85, speakers: 3 }
        ];

        setDna(dnaResult || fallbackDna);
        setTimeline(timelineResult || fallbackTimeline);

        // Build department data from trends if available
        if (trendsResult && Array.isArray(trendsResult) && trendsResult.length > 0) {
          const depts = trendsResult.map((t: any) => ({
            name: t.label || t.department || t.period || 'Team',
            energy: t.energy ?? t.engagement ?? Math.round(100 - (t.stress ?? 30)),
            focus: t.focus ?? t.focus_score ?? 80,
            stress: t.stress ?? t.stress_percent ?? 30
          }));
          setDepartmentData(depts.slice(0, 6));
        }

        // Build burnout warnings from DNA data
        const warnings: any[] = [];
        if (dnaResult.stress_percent > 50) {
          warnings.push({
            title: 'Elevated team stress detected',
            description: `Stress indicators at ${dnaResult.stress_percent}% — exceeds safe threshold`,
            risk: 'HIGH RISK',
            riskColor: 'text-red-400',
            stressValue: `${dnaResult.stress_percent}% stress`
          });
        }
        if (dnaResult.engagement_percent < 60) {
          warnings.push({
            title: 'Low engagement warning',
            description: `Engagement dropped to ${dnaResult.engagement_percent}% — team may need a reset`,
            risk: 'MODERATE',
            riskColor: 'text-yellow-400',
            stressValue: `${100 - dnaResult.engagement_percent}% disengaged`
          });
        }
        if (warnings.length === 0) {
          warnings.push({
            title: 'Team energy levels stable',
            description: 'Focus intervals and engagement are within healthy ranges',
            risk: 'STABLE',
            riskColor: 'text-emerald-400',
            stressValue: `${dnaResult.stress_percent}% stress`
          });
        }
        setBurnoutWarnings(warnings);

        // Generate AI diagnostic from real data
        const stressLevel = dnaResult.stress_percent ?? 0;
        const focusScore = dnaResult.focus_score ?? 0;
        const positivePercent = dnaResult.positive_percent ?? 0;
        let diag = '';
        if (stressLevel > 50) {
          diag = `Linguistic evaluation indicates stress indicators at ${stressLevel}%. Recommend scheduling shorter meetings (25 min max) and implementing "Quiet Block" periods to reduce burnout fatigue. Focus score is at ${focusScore}%.`;
        } else if (positivePercent > 70) {
          diag = `Team morale is strong with ${positivePercent}% positive sentiment and only ${stressLevel}% stress. Current meeting cadence is effective. Consider maintaining this rhythm and celebrating recent team wins.`;
        } else {
          diag = `Mixed sentiment detected — ${positivePercent}% positive, ${stressLevel}% stress. Recommend a brief 15-minute wellness check-in and limiting consecutive video sessions to preserve focus (currently at ${focusScore}%).`;
        }
        setAiDiagnostic(diag);
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
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">{burnoutWarnings.filter(w => w.risk === 'HIGH RISK').length} ALARM{burnoutWarnings.filter(w => w.risk === 'HIGH RISK').length !== 1 ? 'S' : ''}</span>
            </div>

            <div className="space-y-4">
              {burnoutWarnings.map((warning, idx) => (
                <div key={idx} className={`flex items-center justify-between ${idx < burnoutWarnings.length - 1 ? 'border-b border-[var(--theme-divider)] pb-2.5' : ''}`}>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--theme-text)]">{warning.title}</h4>
                    <p className="text-[10px] text-[var(--theme-text-muted)]">{warning.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs ${warning.riskColor} font-bold font-mono`}>{warning.risk}</span>
                    <span className="block text-[10px] text-[var(--theme-text-muted)] font-mono">{warning.stressValue}</span>
                  </div>
                </div>
              ))}
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
                <BarChart data={departmentData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
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
              {aiDiagnostic || 'Analyzing meeting sentiment data to generate diagnostic recommendations...'}
            </p>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};
export default TeamMood;
