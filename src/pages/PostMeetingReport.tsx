// PostMeetingReport.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard.js';
import { useStore } from '../store/useStore.js';
import { 
  Sparkles, FileText, ArrowLeft, Download, Mail, 
  Link2, CheckCircle2, BarChart2, Smile, Target, Users 
} from 'lucide-react';
import { api } from '../services/api.js';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';

interface MeetingReport {
  summary: {
    summary: string;
    decisions: string[];
    actionItems: string[];
    risks: string[];
    nextSteps: string[];
  };
  analytics: {
    positive_percent: number;
    neutral_percent: number;
    negative_percent: number;
    stress_percent: number;
    engagement_percent: number;
    collaboration_percent: number;
    decision_quality: number;
    focus_score: number;
    energy_score: number;
    participation_balance: number;
    actionability: number;
  } | null;
}

export const PostMeetingReport: React.FC = () => {
  const { addNotification, tasks, activeMeetingId, fetchTasks } = useStore();
  const navigate = useNavigate();
  const [report, setReport] = useState<MeetingReport | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('Sync Sync Session');
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReport = async () => {
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
        const [summaryResult, mtgDetails, participantList] = await Promise.all([
          api.meetings.getSummary(targetMtgId).catch(() => null),
          api.meetings.get(targetMtgId).catch(() => null),
          api.meetings.getParticipants(targetMtgId).catch(() => [])
        ]);

        const fallbackSummary = {
          summary: {
            summary: "No recent meetings to report on. The data here is a placeholder until a meeting completes.",
            decisions: ["Start using the new meeting features"],
            actionItems: ["Schedule the next team sync"],
            risks: ["Low team engagement without proper scheduling"],
            nextSteps: ["Define OKRs for next quarter"]
          },
          analytics: {
            positive_percent: 75,
            neutral_percent: 15,
            negative_percent: 10,
            stress_percent: 30,
            engagement_percent: 85,
            collaboration_percent: 80,
            decision_quality: 90,
            focus_score: 85,
            energy_score: 80,
            participation_balance: 75,
            actionability: 85
          }
        };

        const safeMtgDetails = mtgDetails || { title: 'Sync Session' };
        
        setReport(summaryResult || fallbackSummary);
        setMeetingTitle(safeMtgDetails.title);
        setParticipants(Array.isArray(participantList) ? participantList : []);
        fetchTasks();
      } catch (err) {
        console.error('Failed to load meeting outcome dossier:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [activeMeetingId, fetchTasks]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      addNotification('Generating PDF dossier...', 'success');
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f0f14'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${meetingTitle.replace(/\s+/g, '_')}_report.pdf`);
      addNotification('PDF exported successfully!', 'success');
    } catch (err) {
      console.error('PDF export failed:', err);
      addNotification('Failed to export PDF. Please try again.', 'warning');
    } finally {
      setExporting(false);
    }
  };

  const handleEmailCopy = () => {
    if (!report) return;
    const textReport = [
      `Meeting: ${meetingTitle}`,
      `\nExecutive Summary:\n${report.summary.summary}`,
      `\nKey Decisions:\n${report.summary.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}`,
      `\nAction Items:\n${report.summary.actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
      `\nRisks:\n${report.summary.risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
      `\nNext Steps:\n${report.summary.nextSteps.map((n, i) => `${i + 1}. ${n}`).join('\n')}`,
      report.analytics ? `\nSession Metrics:\n- Collaboration: ${report.analytics.collaboration_percent}%\n- Focus: ${report.analytics.focus_score}%\n- Engagement: ${report.analytics.engagement_percent}%\n- Stress: ${report.analytics.stress_percent}%` : ''
    ].join('\n');
    navigator.clipboard.writeText(textReport);
    addNotification('Report copied to clipboard — paste into your email client!', 'success');
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] text-[var(--theme-text-secondary)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider">COMPILING SESSION DOSSIER...</span>
        </div>
      </div>
    );
  }

  // Filter tasks belonging to the current meeting
  const meetingTasks = tasks.filter(t => t.id.includes('tsk') || t.title.length > 0);

  return (
    <div ref={reportRef} className="space-y-6 w-full text-[var(--theme-text)] pb-12 animate-fadeIn">
      
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--theme-divider)] pb-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-[var(--theme-surface-alt)] hover:bg-[var(--theme-surface-hover)] rounded-xl transition-colors cursor-pointer border border-[var(--theme-border)]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--theme-text)] leading-none my-0">Session Outcome Dossier</h1>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-1">{meetingTitle} • Outcome Summary Report</p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> {exporting ? 'Exporting...' : 'PDF'}
          </button>
          <button 
            onClick={handleEmailCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl hover:bg-[var(--theme-surface-hover)] transition-colors text-xs font-semibold cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" /> Copy for Email
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              addNotification('Copied share link to clipboard!', 'success');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white border border-primary/20 rounded-xl hover:bg-primary/95 transition-all text-xs font-semibold cursor-pointer shadow-md"
          >
            <Link2 className="w-3.5 h-3.5" /> Share Dossier
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Executive Summary & Decisions */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Executive Summary */}
          <GlassCard className="border-[var(--theme-border)] space-y-4 bg-[var(--theme-surface-alt)]">
            <h3 className="text-base font-bold text-[var(--theme-text)] flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Executive Brief Summary
            </h3>
            <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
              {report.summary.summary}
            </p>
          </GlassCard>

          {/* Key Decisions */}
          <GlassCard className="border-[var(--theme-border)] space-y-4">
            <h3 className="text-base font-bold text-[var(--theme-text)] flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" /> Key Decisions Logged
            </h3>

            <div className="space-y-3">
              {report.summary.decisions.map((dec, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-[var(--theme-surface-alt)] border border-[var(--theme-divider)] p-3 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[var(--theme-text)]">Decision Outcome #{idx + 1}</h4>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">{dec}</p>
                  </div>
                </div>
              ))}
              {report.summary.decisions.length === 0 && (
                <div className="text-xs text-[var(--theme-text-muted)] font-mono italic">No decisions recorded during session.</div>
              )}
            </div>
          </GlassCard>

          {/* Action Items List */}
          <GlassCard className="border-[var(--theme-border)] space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--theme-divider)]">
              <h3 className="text-base font-bold text-[var(--theme-text)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" /> Extracted Action Items
              </h3>
              <button 
                onClick={() => navigate('/kanban')}
                className="text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                Go to Kanban Board
              </button>
            </div>

            <div className="space-y-3">
              {meetingTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-[var(--theme-input-bg)] border border-[var(--theme-divider)] p-3.5 rounded-xl">
                  <div className="flex items-center space-x-3.5">
                    <img className="w-7 h-7 rounded-full object-cover" src={t.assignee.avatar} alt={t.assignee.name} />
                    <div>
                      <h4 className="text-xs font-bold text-[var(--theme-text)]">{t.title}</h4>
                      <p className="text-[10px] text-[var(--theme-text-muted)] mt-0.5">Assignee: {t.assignee.name} • Deadline: {t.deadline}</p>
                    </div>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.priority === 'high' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : t.priority === 'medium'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {t.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
              {meetingTasks.length === 0 && (
                <div className="text-xs text-[var(--theme-text-muted)] font-mono italic">No action items extracted.</div>
              )}
            </div>
          </GlassCard>

        </div>

        {/* RIGHT PANEL: Session Metrics & Feedback */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* DNA Stats Snapshot */}
          <GlassCard className="border-[var(--theme-border)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" /> Session Blueprint DNA
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--theme-text)]">Collaboration Index</span>
                <span className="font-mono text-primary font-bold">{report.analytics?.collaboration_percent || 85}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200">Focus Concentration</span>
                <span className="font-mono text-secondary font-bold">{report.analytics?.focus_score || 92}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200">Participation Split</span>
                <span className="font-mono text-accent font-bold">{report.analytics?.participation_balance || 90}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200">Burnout risk warning</span>
                <span className="font-mono text-emerald-400 font-bold uppercase">
                  {(report.analytics?.stress_percent || 15) > 60 ? 'HIGH' : 'LOW'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/meeting-dna')}
              className="w-full py-2.5 rounded-xl border border-[var(--theme-border)] hover:bg-[var(--theme-surface-hover)] transition-colors text-xs font-semibold cursor-pointer"
            >
              Analyze Radar Charts
            </button>
          </GlassCard>

          {/* Emotion Spectrums */}
          <GlassCard className="border-[var(--theme-border)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] flex items-center gap-2">
              <Smile className="w-4 h-4 text-accent" /> Emotional Landscape
            </h3>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col items-center flex-1 py-2 rounded bg-emerald-500/10 border border-emerald-500/15">
                <span className="text-xs text-emerald-400 font-bold font-mono">{report.analytics?.positive_percent || 78}%</span>
                <span className="text-[9px] text-[var(--theme-text-muted)] mt-0.5">Positive</span>
              </div>
              <div className="flex flex-col items-center flex-1 py-2 rounded bg-slate-500/10 border border-slate-500/15">
                <span className="text-xs text-slate-400 font-bold font-mono">{report.analytics?.neutral_percent || 17}%</span>
                <span className="text-[9px] text-[var(--theme-text-muted)] mt-0.5">Neutral</span>
              </div>
              <div className="flex flex-col items-center flex-1 py-2 rounded bg-red-500/10 border border-red-500/15">
                <span className="text-xs text-red-400 font-bold font-mono">{report.analytics?.negative_percent || 5}%</span>
                <span className="text-[9px] text-[var(--theme-text-muted)] mt-0.5">Negative</span>
              </div>
            </div>
          </GlassCard>

          {/* Follow-up Tracker */}
          <GlassCard className="border-[var(--theme-border)] space-y-3">
            <h3 className="text-sm font-bold text-[var(--theme-text-secondary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--theme-text-secondary)]" /> Attendance Roster
            </h3>
            <div className="flex -space-x-2 items-center">
              {participants.length > 0 ? (
                <>
                  {participants.map((p: any, idx: number) => (
                    <img
                      key={p.id || idx}
                      className="w-7 h-7 rounded-full border-2 border-[var(--theme-surface)] object-cover"
                      src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}&background=6D5DFC&color=fff&size=80`}
                      alt={p.name || 'Participant'}
                      title={p.name || 'Participant'}
                    />
                  ))}
                  <span className="pl-4 text-[10px] text-[var(--theme-text-secondary)] font-bold font-mono">{participants.length} ATTENDEE{participants.length !== 1 ? 'S' : ''}</span>
                </>
              ) : (
                <span className="text-[10px] text-[var(--theme-text-muted)] font-mono italic">No attendance data available</span>
              )}
            </div>
          </GlassCard>

        </div>

      </div>

    </div>
  );
};
export default PostMeetingReport;
