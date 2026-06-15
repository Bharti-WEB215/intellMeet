import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { GlassCard } from '../components/GlassCard';
import {
  Sparkles, ArrowRight, Play,
  Activity, Smile, Zap, MessageSquare,
  BrainCircuit, Star, BarChart3, 
  CheckCircle2, Mic, ListTodo, TrendingUp,
  Clock, Shield, ChevronRight
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar
} from 'recharts';
import ThemeToggle from '../components/ThemeToggle';

/* ═══════════════════════════════════════════════════════════
   PARTICLE CANVAS — Theme-aware floating particles
   ═══════════════════════════════════════════════════════════ */
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--theme-primary').trim() || '#7C3AED';
    const secondaryColor = computedStyle.getPropertyValue('--theme-secondary').trim() || '#06B6D4';

    const hexToRgba = (hex: string, a: number) => {
      const r = parseInt(hex.slice(1, 3), 16) || 124;
      const g = parseInt(hex.slice(3, 5), 16) || 58;
      const b = parseInt(hex.slice(5, 7), 16) || 237;
      return `rgba(${r},${g},${b},${a})`;
    };

    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }> = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 2 + 0.6,
        color: i % 2 === 0 ? hexToRgba(primaryColor, 0.18) : hexToRgba(secondaryColor, 0.14),
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const lineColor = hexToRgba(secondaryColor, 0.04);

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER — Scroll-triggered number animation
   ═══════════════════════════════════════════════════════════ */
const Counter: React.FC<{ target: number; suffix?: string; decimals?: boolean }> = ({
  target,
  suffix = '',
  decimals = false,
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Number(start.toFixed(decimals ? 1 : 0)));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [inView, target, decimals]);

  return (
    <span ref={ref} className="font-mono">
      {count}
      {suffix}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════
   LOADER PULSE — AI thinking dots
   ═══════════════════════════════════════════════════════════ */
const LoaderPulse: React.FC = () => (
  <div className="flex items-center space-x-1">
    <span className="w-1.5 h-1.5 bg-[var(--theme-primary)] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
    <span className="w-1.5 h-1.5 bg-[var(--theme-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
    <span className="w-1.5 h-1.5 bg-[var(--theme-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
  </div>
);

/* ═══════════════════════════════════════════════════════════
   VOICE WAVEFORM — Animated bars
   ═══════════════════════════════════════════════════════════ */
const VoiceWaveform: React.FC<{ barCount?: number; color?: string; height?: string }> = ({
  barCount = 12,
  color = 'var(--theme-primary)',
  height = '24px',
}) => (
  <div className="flex items-end gap-[2px]" style={{ height }}>
    {Array.from({ length: barCount }).map((_, i) => (
      <div
        key={i}
        className="wave-bar rounded-full"
        style={{
          width: '3px',
          height: '100%',
          background: color,
          opacity: 0.7,
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   AVATAR STACK — Overlapping team avatars
   ═══════════════════════════════════════════════════════════ */
const avatarUrls = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80',
];

const AvatarStack: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <div className="flex items-center">
    {avatarUrls.map((url, i) => (
      <img
        key={i}
        src={url}
        alt={`Team member ${i + 1}`}
        className="rounded-full border-2 border-[var(--theme-bg)] object-cover"
        style={{ width: size, height: size, marginLeft: i > 0 ? -8 : 0, zIndex: avatarUrls.length - i }}
      />
    ))}
    <span className="ml-2 text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">
      +12 online
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MINI SPARKLINE — For hero command center
   ═══════════════════════════════════════════════════════════ */
const miniSparkData = [
  { v: 30 }, { v: 45 }, { v: 35 }, { v: 60 }, { v: 50 }, { v: 72 }, { v: 65 }, { v: 80 },
];

/* ═══════════════════════════════════════════════════════════
   DATA — Mock chart datasets
   ═══════════════════════════════════════════════════════════ */
const miniMoodData = [
  { time: '10m', mood: 55 },
  { time: '20m', mood: 72 },
  { time: '30m', mood: 68 },
  { time: '40m', mood: 88 },
  { time: '50m', mood: 82 },
  { time: '60m', mood: 92 },
];

const miniDnaData = [
  { subject: 'Focus', score: 92 },
  { subject: 'Mood', score: 80 },
  { subject: 'Energy', score: 88 },
  { subject: 'Clarity', score: 85 },
  { subject: 'Outcome', score: 91 },
];

const miniBarData = [
  { name: 'Mon', val: 65 },
  { name: 'Tue', val: 80 },
  { name: 'Wed', val: 72 },
  { name: 'Thu', val: 90 },
  { name: 'Fri', val: 85 },
];

/* ═══════════════════════════════════════════════════════════
   SCROLL SECTION WRAPPER — Fade/slide in on scroll
   ═══════════════════════════════════════════════════════════ */
const ScrollSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export const LandingPage: React.FC = () => {
  const { setCurrentView, theme, toggleTheme } = useStore();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  /* — Typewriter transcript animation — */
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const speakerPhrases = useMemo(
    () => [
      'Sarah: We need the dashboard cards to use glassmorphism with blur-24.',
      'Alex: I\'ve mapped the Recharts radar chart to the meeting DNA endpoint.',
      'Elena: The mobile breakpoint at 768px is fixed — tested on 3 devices.',
    ],
    []
  );
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [phraseProgress, setPhraseProgress] = useState(0);

  useEffect(() => {
    const text = speakerPhrases[currentPhraseIdx];
    const charTimer = setInterval(() => {
      if (phraseProgress < text.length) {
        setPhraseProgress((p) => p + 1);
      } else {
        clearInterval(charTimer);
        setTimeout(() => {
          setTranscripts((prev) => [...prev.slice(-2), text]);
          setPhraseProgress(0);
          setCurrentPhraseIdx((prev) => (prev + 1) % speakerPhrases.length);
        }, 2200);
      }
    }, 38);
    return () => clearInterval(charTimer);
  }, [currentPhraseIdx, phraseProgress, speakerPhrases]);

  /* — Mouse follow glow — */
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  /* — Animation variants — */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100, damping: 20 } },
  };

  const bentoContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  };

  const bentoCardVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.97 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 100, damping: 22 } },
  };

  const bentoRef = useRef(null);
  const bentoInView = useInView(bentoRef, { once: true, margin: '-60px' });

  const aiRef = useRef(null);
  const aiInView = useInView(aiRef, { once: true, margin: '-60px' });

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-60px' });

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div
      onMouseMove={handleMouseMove}
      className="aurora-container min-h-screen relative flex flex-col w-full text-[var(--theme-text)] overflow-x-hidden"
    >
      {/* Particle Canvas & Cursor Glow */}
      <ParticleCanvas />
      <div
        className="absolute pointer-events-none inset-0 transition-opacity duration-500 opacity-40 z-0"
        style={{
          background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, var(--theme-aurora-1), transparent 80%)`,
        }}
      />
      {/* Aurora orb for ambient lighting */}
      <div className="aurora-orb-3" />

      {/* ════════════════════════════════════════════════════
          1. FLOATING GLASSMORPHIC NAVBAR
          ════════════════════════════════════════════════════ */}
      <header className="sticky top-3 z-50 mx-auto w-[calc(100%-2rem)] max-w-6xl">
        <nav className="glass-panel rounded-2xl px-5 py-3 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer group"
            onClick={() => setCurrentView('landing')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
              <span className="text-[var(--theme-text)]">Intell</span>
              <span style={{ color: 'var(--theme-secondary)' }}>Meet</span>
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-8 text-[13px] font-semibold text-[var(--theme-text-secondary)]">
            {[
              { label: 'Features', href: '#features', color: 'var(--theme-primary)' },
              { label: 'AI Intelligence', href: '#ai-intelligence', color: 'var(--theme-secondary)' },
              { label: 'Metrics', href: '#metrics', color: 'var(--theme-accent)' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative py-1 group transition-colors hover:text-[var(--theme-text)]"
              >
                {link.label}
                <span
                  className="absolute bottom-0 left-0 w-0 h-[2px] rounded-full transition-all duration-300 group-hover:w-full"
                  style={{ background: link.color }}
                />
              </a>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center space-x-3">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              onClick={() => setCurrentView('auth')}
              className="hidden sm:inline-flex text-[13px] font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => setCurrentView('auth')}
              className="btn-glow btn-magnetic text-[12px] font-bold px-5 py-2.5 rounded-xl text-white border border-[var(--theme-primary)]/20 shadow-lg cursor-pointer"
              style={{ background: 'var(--theme-primary)' }}
            >
              Start Free
              <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        </nav>
      </header>

      {/* ════════════════════════════════════════════════════
          2. HERO SECTION
          ════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-16 pb-12 lg:pt-24 lg:pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full z-10 relative">
        {/* Left — Copy */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="lg:col-span-5 flex flex-col space-y-7 text-center lg:text-left"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex self-center lg:self-start items-center space-x-2 border border-[var(--theme-border)] bg-[var(--theme-surface-alt)] rounded-full px-4 py-1.5 text-[10px] text-[var(--theme-text-secondary)] font-bold tracking-widest uppercase"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)] animate-pulse" />
            <span>Introducing IntellMeet AI</span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute -inset-x-8 -top-12 bottom-0 bg-[var(--theme-aurora-1)] filter blur-[80px] rounded-full z-0 opacity-60" />
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight relative z-10"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              Meetings That <br className="hidden sm:inline" />
              <span className="gradient-text-animated">Think For You</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-[15px] sm:text-base text-[var(--theme-text-secondary)] max-w-lg mx-auto lg:mx-0 leading-relaxed"
          >
            Transform conversations into decisions, action items, and measurable outcomes.
            Unchain your team from note‑taking with AI that listens, understands, and acts.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
          >
            <button
              onClick={() => setCurrentView('auth')}
              className="btn-glow btn-magnetic w-full sm:w-auto px-7 py-3.5 text-white font-bold rounded-xl border border-white/10 shadow-xl flex items-center justify-center space-x-2 cursor-pointer text-[13px]"
              style={{ background: 'var(--theme-primary)' }}
            >
              <span>Enter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="btn-magnetic w-full sm:w-auto px-7 py-3.5 glass-panel rounded-xl text-center text-[13px] font-semibold flex items-center justify-center space-x-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
            >
              <Play className="w-3.5 h-3.5" style={{ color: 'var(--theme-secondary)' }} />
              <span>Explore Features</span>
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={itemVariants} className="pt-4 flex flex-col sm:flex-row items-center gap-4 lg:gap-6">
            <AvatarStack size={30} />
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-[11px] text-[var(--theme-text-muted)] font-semibold ml-1">4.9/5 from 2,400+ teams</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right — AI Command Center */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="lg:col-span-7 relative flex justify-center items-center"
        >
          {/* Floating holographic elements */}
          <div className="absolute -top-6 -left-6 z-30 hidden lg:block float-gentle" style={{ animationDelay: '0s' }}>
            <div className="glass-panel rounded-xl px-3 py-2 flex items-center space-x-2 shadow-lg">
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
              <span className="text-[10px] font-bold text-[var(--theme-text-secondary)]">E2E Encrypted</span>
            </div>
          </div>

          <div className="absolute -bottom-4 -left-4 z-30 hidden lg:block float-slow" style={{ animationDelay: '1s' }}>
            <div className="glass-panel rounded-xl px-3 py-2 flex items-center space-x-2 shadow-lg">
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--theme-secondary)' }} />
              <span className="text-[10px] font-bold font-mono text-[var(--theme-text-secondary)]">42:18</span>
              <span className="text-[9px] text-[var(--theme-text-muted)]">elapsed</span>
            </div>
          </div>

          <div className="absolute top-8 -right-4 z-30 hidden lg:block float-gentle" style={{ animationDelay: '2s' }}>
            <div className="glass-panel rounded-xl px-3 py-2 flex items-center space-x-2 shadow-lg">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
              <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--theme-accent)' }}>+23%</span>
              <span className="text-[9px] text-[var(--theme-text-muted)]">productivity</span>
            </div>
          </div>

          {/* Main Command Center Card */}
          <GlassCard className="relative w-full max-w-2xl border-[var(--theme-border)] shadow-2xl p-0 overflow-hidden bg-[var(--theme-input-bg)]">
            {/* Title bar */}
            <div className="flex justify-between items-center border-b border-[var(--theme-divider)] px-5 py-3.5">
              <div className="flex space-x-2 items-center">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-[10px] text-[var(--theme-text-muted)] font-mono pl-3">ai-command-center_v2.0</span>
              </div>
              <div className="flex items-center gap-2.5">
                <AvatarStack size={22} />
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Live transcript panel */}
              <div className="border border-[var(--theme-divider)] bg-[var(--theme-bg)] rounded-xl p-4 space-y-3 min-h-[130px]">
                <div className="flex justify-between items-center text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                    Live Speech Capture
                  </span>
                  <div className="flex items-center gap-2">
                    <VoiceWaveform barCount={6} color="var(--theme-primary)" height="14px" />
                    <LoaderPulse />
                    <span className="text-[8px]" style={{ color: 'var(--theme-primary)' }}>
                      Processing...
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {transcripts.map((t, idx) => (
                    <p key={idx} className="text-[11px] text-[var(--theme-text-muted)]">
                      {t}
                    </p>
                  ))}
                  <p className="text-[12px] text-[var(--theme-text)] font-medium">
                    {speakerPhrases[currentPhraseIdx].slice(0, phraseProgress)}
                    <span className="streaming-cursor" />
                  </p>
                </div>
              </div>

              {/* Bottom panels grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Smart recommendation */}
                <div className="border border-[var(--theme-divider)] bg-[var(--theme-bg)] rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[9px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider">
                    <span>AI Alert</span>
                    <Sparkles className="w-3 h-3" style={{ color: 'var(--theme-accent)' }} />
                  </div>
                  <div className="mt-2 space-y-1">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--theme-accent)' }}>
                      Burnout Warning
                    </span>
                    <p className="text-[9px] text-[var(--theme-text-muted)] leading-snug line-clamp-2">
                      Design team exceeded 4h continuous sync.
                    </p>
                  </div>
                </div>

                {/* Sentiment */}
                <div className="border border-[var(--theme-divider)] bg-[var(--theme-bg)] rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[9px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider">
                    <span>Sentiment</span>
                    <Smile className="w-3 h-3" style={{ color: 'var(--theme-secondary)' }} />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black font-mono" style={{ color: 'var(--theme-secondary)' }}>
                      92%
                    </span>
                    <span className="text-[9px] text-[var(--theme-text-muted)] ml-1 uppercase font-bold">Optimal</span>
                  </div>
                </div>

                {/* Mini sparkline */}
                <div className="border border-[var(--theme-divider)] bg-[var(--theme-bg)] rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[9px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider">
                    <span>Engagement</span>
                    <Activity className="w-3 h-3" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div className="mt-1 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={miniSparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                        <defs>
                          <linearGradient id="heroSparkGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="var(--theme-primary)"
                          strokeWidth={1.5}
                          fill="url(#heroSparkGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between text-[9px] text-[var(--theme-text-muted)] pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-mono font-semibold">REC 00:42:18</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono">3 speakers detected</span>
                  <span className="font-mono">4 action items</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Floating Orb with pulse-ring */}
          <div className="absolute -top-10 -right-6 z-20 hidden lg:block">
            <motion.div
              whileHover={{ scale: 1.15, rotate: 15 }}
              className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--theme-primary)] via-[var(--theme-secondary)] to-[var(--theme-accent)] flex items-center justify-center shadow-2xl cursor-pointer"
            >
              <div className="absolute inset-0 rounded-full pulse-ring bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] opacity-40" />
              <div className="absolute inset-[3px] rounded-full bg-[var(--theme-bg)]" />
              <Sparkles className="w-6 h-6 text-[var(--theme-text)] relative z-10" />
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* ════════════════════════════════════════════════════
          3. FEATURE BENTO GRID SECTION
          ════════════════════════════════════════════════════ */}
      <section
        id="features"
        className="py-24 border-t border-[var(--theme-divider)] bg-[var(--theme-bg-secondary)] w-full z-10 relative dot-grid"
      >
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <ScrollSection className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 border border-[var(--theme-border)] bg-[var(--theme-surface-alt)] rounded-full px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase text-[var(--theme-text-secondary)]">
              <Star className="w-3 h-3" style={{ color: 'var(--theme-secondary)' }} />
              <span>Full-Suite Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>
              Everything your team needs,{' '}
              <span className="gradient-text-animated">unified</span>
            </h2>
            <p className="text-[14px] text-[var(--theme-text-secondary)] max-w-lg mx-auto leading-relaxed">
              Six intelligent modules working together under a single, executive board. No switching tools, no context loss.
            </p>
          </ScrollSection>

          {/* Bento Grid */}
          <motion.div
            ref={bentoRef}
            initial="hidden"
            animate={bentoInView ? 'visible' : 'hidden'}
            variants={bentoContainerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {/* Card 1: Team Mood Analysis (col-span-2) */}
            <motion.div variants={bentoCardVariants} className="col-span-1 md:col-span-2">
              <div className="glass-panel glass-panel-hover card-shine rounded-2xl p-6 h-full flex flex-col justify-between min-h-[260px] group">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <div className="rounded-xl p-2 border border-[var(--theme-border)]" style={{ background: 'var(--theme-surface-alt)' }}>
                        <Smile className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                      </div>
                      <h3 className="text-base font-bold text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>
                        Team Mood Analysis
                      </h3>
                    </div>
                    <p className="text-[13px] text-[var(--theme-text-secondary)] max-w-md leading-relaxed">
                      Map motivated, neutral, stressed, or fatigued indicators using vocal pitch analysis. Protect teams from meeting burnout in real-time.
                    </p>
                  </div>
                  <div className="w-36 h-20 hidden sm:block">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={miniMoodData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                        <defs>
                          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="mood" stroke="var(--theme-primary)" strokeWidth={2} fill="url(#moodGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold mt-5 uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                  <span>Explore Mood Timelines</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>

            {/* Card 2: Meeting DNA Blueprint */}
            <motion.div variants={bentoCardVariants}>
              <div className="glass-panel glass-panel-hover card-shine rounded-2xl p-6 h-full flex flex-col justify-between min-h-[260px] group">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="rounded-xl p-2 border border-[var(--theme-border)]" style={{ background: 'var(--theme-surface-alt)' }}>
                      <Activity className="w-5 h-5" style={{ color: 'var(--theme-secondary)' }} />
                    </div>
                    <h3 className="text-base font-bold text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>
                      Meeting DNA Blueprint
                    </h3>
                  </div>
                  <p className="text-[13px] text-[var(--theme-text-secondary)] leading-relaxed">
                    Visual outcomes mapping clarity, collaboration scoring, and decision matrices.
                  </p>
                </div>
                <div className="w-full h-24 mt-3 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={miniDnaData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="var(--theme-grid-line)" strokeWidth={1} />
                      <PolarAngleAxis dataKey="subject" tick={false} />
                      <Radar dataKey="score" stroke="var(--theme-secondary)" fill="var(--theme-secondary)" fillOpacity={0.15} strokeWidth={1.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold mt-3 uppercase tracking-wider" style={{ color: 'var(--theme-secondary)' }}>
                  <span>View DNA Structure</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>

            {/* Card 3: Real-Time AI Extraction */}
            <motion.div variants={bentoCardVariants}>
              <div className="glass-panel glass-panel-hover card-shine rounded-2xl p-6 h-full flex flex-col justify-between min-h-[260px] group">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="rounded-xl p-2 border border-[var(--theme-border)]" style={{ background: 'var(--theme-surface-alt)' }}>
                      <Mic className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                    </div>
                    <h3 className="text-base font-bold text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>
                      Real-Time Extraction
                    </h3>
                  </div>
                  <p className="text-[13px] text-[var(--theme-text-secondary)] leading-relaxed">
                    Auto-transcribe and capture deliverables, compiling summaries and pushing cards directly to Kanban.
                  </p>
                </div>
                {/* Voice waveform visual */}
                <div className="flex items-center justify-center py-4">
                  <VoiceWaveform barCount={16} color="var(--theme-accent)" height="36px" />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold mt-auto uppercase tracking-wider" style={{ color: 'var(--theme-accent)' }}>
                  <span>Inspect Extract Logs</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>

            {/* Card 4: AI Copilot (col-span-2) */}
            <motion.div variants={bentoCardVariants} className="col-span-1 md:col-span-2">
              <div className="glass-panel glass-panel-hover card-shine rounded-2xl p-6 h-full flex flex-col justify-between min-h-[260px] group">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <div className="rounded-xl p-2 border border-[var(--theme-border)]" style={{ background: 'var(--theme-surface-alt)' }}>
                        <MessageSquare className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                      </div>
                      <h3 className="text-base font-bold text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>
                        AI Copilot Assistant
                      </h3>
                    </div>
                    <p className="text-[13px] text-[var(--theme-text-secondary)] max-w-md leading-relaxed">
                      Execute powerful slash commands directly in sync rooms. Compose emails, compile reports, search transcripts, or query action summaries.
                    </p>
                  </div>
                  {/* Streaming text preview */}
                  <div className="hidden sm:block w-48 border border-[var(--theme-divider)] rounded-xl p-3 bg-[var(--theme-bg)]">
                    <div className="text-[9px] text-[var(--theme-text-muted)] uppercase font-bold tracking-wider mb-2">AI Response</div>
                    <p className="text-[10px] text-[var(--theme-text-secondary)] leading-relaxed">
                      Identified 3 action items from the last standup
                      <span className="streaming-cursor" />
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold mt-5 uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                  <span>Launch Assistant Panel</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>

            {/* Card 5: Kanban Task Workspace */}
            <motion.div variants={bentoCardVariants}>
              <div className="glass-panel glass-panel-hover card-shine rounded-2xl p-6 h-full flex flex-col justify-between min-h-[260px] group">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="rounded-xl p-2 border border-[var(--theme-border)]" style={{ background: 'var(--theme-surface-alt)' }}>
                      <ListTodo className="w-5 h-5" style={{ color: 'var(--theme-secondary)' }} />
                    </div>
                    <h3 className="text-base font-bold text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>
                      Kanban Workspace
                    </h3>
                  </div>
                  <p className="text-[13px] text-[var(--theme-text-secondary)] leading-relaxed">
                    AI-generated task cards auto-populate your board with priorities and deadlines.
                  </p>
                </div>
                {/* Mini task cards */}
                <div className="space-y-2 mt-3">
                  {[
                    { label: 'Fix layout snaps', tag: 'High', tagColor: 'var(--theme-danger)' },
                    { label: 'Map radar charts', tag: 'Med', tagColor: 'var(--theme-warning)' },
                    { label: 'Review shadows', tag: 'Low', tagColor: 'var(--theme-success)' },
                  ].map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border border-[var(--theme-divider)] rounded-lg px-3 py-2 bg-[var(--theme-bg)]"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--theme-text-muted)' }} />
                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium">{task.label}</span>
                      </div>
                      <span
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                        style={{ color: task.tagColor, background: `color-mix(in srgb, ${task.tagColor} 15%, transparent)` }}
                      >
                        {task.tag}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold mt-4 uppercase tracking-wider" style={{ color: 'var(--theme-secondary)' }}>
                  <span>Open Kanban Board</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>

            {/* Card 6: Executive Analytics (col-span-2) */}
            <motion.div variants={bentoCardVariants} className="col-span-1 md:col-span-2">
              <div className="glass-panel glass-panel-hover card-shine rounded-2xl p-6 h-full flex flex-col justify-between min-h-[260px] group">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <div className="rounded-xl p-2 border border-[var(--theme-border)]" style={{ background: 'var(--theme-surface-alt)' }}>
                        <BarChart3 className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                      </div>
                      <h3 className="text-base font-bold text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>
                        Executive Analytics
                      </h3>
                    </div>
                    <p className="text-[13px] text-[var(--theme-text-secondary)] max-w-md leading-relaxed">
                      Comprehensive dashboards with participation metrics, sentiment trends, and productivity benchmarks across your entire organization.
                    </p>
                  </div>
                  <div className="w-40 h-20 hidden sm:block">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={miniBarData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                        <Bar dataKey="val" fill="var(--theme-accent)" radius={[4, 4, 0, 0]} opacity={0.7} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold mt-5 uppercase tracking-wider" style={{ color: 'var(--theme-accent)' }}>
                  <span>View Full Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          4. AI TRANSCRIPT EXTRACTION SECTION
          ════════════════════════════════════════════════════ */}
      <section id="ai-intelligence" className="py-24 w-full z-10 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            ref={aiRef}
            initial="hidden"
            animate={aiInView ? 'visible' : 'hidden'}
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            {/* Left copy */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="inline-flex items-center space-x-2 border border-[var(--theme-border)] bg-[var(--theme-surface-alt)] rounded-full px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase text-[var(--theme-text-secondary)]">
                <Zap className="w-3 h-3" style={{ color: 'var(--theme-accent)' }} />
                <span>Cognitive Pipeline</span>
              </div>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-[var(--theme-text)]"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                From conversation to{' '}
                <span className="gradient-text-animated">action</span>, instantly
              </h2>
              <p className="text-[14px] text-[var(--theme-text-secondary)] leading-relaxed max-w-lg">
                Watch conversations transform into tasks. Our AI pipeline filters audio, compiles transcripts, maps action keywords, and exports task cards to team channels — all in real time.
              </p>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--theme-success)' }} />
                  <span className="text-[12px] text-[var(--theme-text-secondary)] font-medium">Speaker identification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--theme-success)' }} />
                  <span className="text-[12px] text-[var(--theme-text-secondary)] font-medium">Priority detection</span>
                </div>
              </div>
            </motion.div>

            {/* Right workflow visual */}
            <motion.div variants={itemVariants} className="relative">
              <div className="flex flex-col space-y-8 relative z-10">
                {/* Source: Speech bubble */}
                <div className="glass-panel rounded-2xl p-5 max-w-sm flex items-start gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80"
                    alt="Speaker"
                    className="w-10 h-10 rounded-full border-2 border-[var(--theme-border)] flex-shrink-0 object-cover"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono uppercase" style={{ color: 'var(--theme-secondary)' }}>
                        Sarah Connor
                      </span>
                      <span className="text-[8px] text-[var(--theme-text-muted)] font-mono">Design Lead</span>
                    </div>
                    <p className="text-[12px] text-[var(--theme-text)] leading-relaxed">
                      "Make sure the layout uses v4 CSS variables. Alex, map the charts by Friday."
                    </p>
                    <VoiceWaveform barCount={10} color="var(--theme-secondary)" height="16px" />
                  </div>
                </div>

                {/* AI Processing indicator */}
                <div className="flex items-center gap-3 pl-8">
                  <div className="flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>
                      AI Processing
                    </span>
                  </div>
                  <div className="flex-1 h-[1px] border-t-2 border-dashed border-[var(--theme-border)]" />
                  <LoaderPulse />
                </div>

                {/* Target: Extracted task card */}
                <div className="rounded-2xl p-5 max-w-sm ml-auto flex items-start gap-4 border-2" style={{ borderColor: 'var(--theme-primary)', background: 'color-mix(in srgb, var(--theme-primary) 8%, var(--theme-bg))' }}>
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" style={{ color: 'var(--theme-primary)' }} />
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold font-mono uppercase" style={{ color: 'var(--theme-primary)' }}>
                      AI Extracted Deliverable
                    </span>
                    <p className="text-[13px] text-[var(--theme-text)] font-bold">
                      Map DNA Recharts to endpoint
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[9px] text-[var(--theme-text-muted)] font-mono">Assigned: Alex</span>
                      <span className="text-[9px] text-[var(--theme-text-muted)] font-mono">Due: June 13</span>
                      <span
                        className="text-[8px] font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{ color: 'var(--theme-warning)', background: 'color-mix(in srgb, var(--theme-warning) 15%, transparent)' }}
                      >
                        Medium
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting dashed line */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <svg className="w-full h-full" style={{ minHeight: '280px' }}>
                  <path
                    d="M 100 80 C 160 140, 220 160, 280 210"
                    fill="transparent"
                    stroke="var(--theme-primary)"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    strokeOpacity="0.25"
                  />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          5. STATISTICS SECTION
          ════════════════════════════════════════════════════ */}
      <section id="metrics" className="py-24 border-t border-[var(--theme-divider)] bg-[var(--theme-bg-secondary)] w-full z-10 relative dot-grid">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollSection className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>
              Measurable <span className="gradient-text-animated">impact</span>
            </h2>
            <p className="text-[14px] text-[var(--theme-text-secondary)] max-w-lg mx-auto leading-relaxed">
              Real results from teams already using IntellMeet to transform their meetings.
            </p>
          </ScrollSection>

          <motion.div
            ref={statsRef}
            initial="hidden"
            animate={statsInView ? 'visible' : 'hidden'}
            variants={bentoContainerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                target: 42,
                suffix: '%',
                label: 'Fatigue Reduction',
                desc: 'Systematic check-ins prevent dev burnout overlaps.',
                gradient: 'from-[var(--theme-primary)] to-[var(--theme-secondary)]',
              },
              {
                target: 1.8,
                suffix: 'h',
                decimals: true,
                label: 'Saved Weekly / Person',
                desc: 'No manual retrospect writing or note compiling.',
                gradient: 'from-[var(--theme-secondary)] to-[var(--theme-accent)]',
              },
              {
                target: 94,
                suffix: '%',
                label: 'Task Completion',
                desc: 'AI deliverables logs keep timelines on schedule.',
                gradient: 'from-[var(--theme-accent)] to-[var(--theme-primary)]',
              },
              {
                target: 250,
                suffix: 'K+',
                label: 'Syncs Conducted',
                desc: 'Empowering software teams globally.',
                gradient: 'from-[var(--theme-primary)] to-[var(--theme-accent)]',
              },
            ].map((stat, i) => (
              <motion.div key={i} variants={bentoCardVariants}>
                <div className="glass-panel glass-panel-hover card-shine rounded-2xl p-7 text-center space-y-3 h-full">
                  <p className={`text-4xl lg:text-5xl font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    <Counter target={stat.target} suffix={stat.suffix} decimals={stat.decimals} />
                  </p>
                  <h3 className="text-sm font-bold text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>
                    {stat.label}
                  </h3>
                  <p className="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
                    {stat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          6. FOOTER
          ════════════════════════════════════════════════════ */}
      <footer className="border-t border-[var(--theme-divider)] bg-[var(--theme-bg)] py-12 px-6 w-full z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[12px] text-[var(--theme-text-muted)]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-[var(--theme-text)]" style={{ fontFamily: 'Space Grotesk' }}>
              IntellMeet
            </span>
          </div>
          <p>© 2026 IntellMeet AI Platforms Corp. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-[var(--theme-text)] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-[var(--theme-text)] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-[var(--theme-text)] transition-colors">
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
